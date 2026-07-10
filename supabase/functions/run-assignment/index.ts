import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  runAssignmentEngine,
  type RandomFn,
} from "../_shared/assignment-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function createSecureRandom(): RandomFn {
  return () => {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] / (0xffffffff + 1);
  };
}

async function hashSeed(parts: string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join("|"));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let lockedRoundId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { roundId } = await req.json();
    if (!roundId) {
      return new Response(JSON.stringify({ error: "roundId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: round, error: roundError } = await adminClient
      .from("assignment_rounds")
      .select("*")
      .eq("id", roundId)
      .single();

    if (roundError || !round) {
      return new Response(JSON.stringify({ error: "Round not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (round.status !== "closed") {
      return new Response(
        JSON.stringify({ error: "Round must be closed before assignment" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: lockError } = await adminClient
      .from("assignment_rounds")
      .update({ status: "running" })
      .eq("id", roundId)
      .eq("status", "closed");

    if (lockError) {
      return new Response(
        JSON.stringify({ error: "Could not lock round for assignment" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    lockedRoundId = roundId;

    const [{ data: departments }, { data: preferences }] = await Promise.all([
      adminClient
        .from("departments")
        .select("id, capacity")
        .eq("is_active", true),
      adminClient
        .from("preferences")
        .select("nurse_id, choice_1, choice_2, choice_3, submitted_at")
        .eq("round_id", roundId),
    ]);

    const random = createSecureRandom();
    const result = runAssignmentEngine(
      (departments ?? []).map((d) => ({ id: d.id, capacity: d.capacity })),
      (preferences ?? []).map((p) => ({
        nurseId: p.nurse_id,
        choice1: p.choice_1,
        choice2: p.choice_2,
        choice3: p.choice_3,
        submittedAt: p.submitted_at,
      })),
      random,
    );

    const lotteryEvents = await Promise.all(
      result.lotteryEvents.map(async (event) => ({
        department_id: event.wardId,
        tier: event.tier,
        applicant_ids: event.applicantIds,
        winner_ids: event.winnerIds,
        slots: event.slots,
        seed_hash: await hashSeed([
          roundId,
          event.wardId,
          String(event.tier),
          ...event.applicantIds,
        ]),
      })),
    );

    const { error: persistError } = await adminClient.rpc(
      "replace_round_results",
      {
        p_round_id: roundId,
        p_assignments: result.assignments.map((assignment) => ({
          nurse_id: assignment.nurseId,
          department_id: assignment.wardId,
          matched_tier: assignment.matchedTier,
        })),
        p_waitlist: result.waitlist.map((nurseId, index) => ({
          nurse_id: nurseId,
          position: index + 1,
        })),
        p_lottery_events: lotteryEvents,
      },
    );

    if (persistError) throw persistError;

    const { error: completeError } = await adminClient
      .from("assignment_rounds")
      .update({ status: "completed" })
      .eq("id", roundId);

    if (completeError) throw completeError;

    return new Response(
      JSON.stringify({
        success: true,
        assigned: result.assignments.length,
        waitlisted: result.waitlist.length,
        lotteries: result.lotteryEvents.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (lockedRoundId) {
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      if (serviceRoleKey && supabaseUrl) {
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        await adminClient
          .from("assignment_rounds")
          .update({ status: "closed" })
          .eq("id", lockedRoundId)
          .eq("status", "running");
      }
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
