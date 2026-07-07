import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type {
  Assignment,
  AssignmentRound,
  LotteryEvent,
  WaitlistEntry,
} from '../types/database'

export function useRealtimeRound(roundId: string | null) {
  const [round, setRound] = useState<AssignmentRound | null>(null)

  useEffect(() => {
    if (!roundId) {
      setRound(null)
      return
    }

    const load = async () => {
      const { data } = await supabase
        .from('assignment_rounds')
        .select('*')
        .eq('id', roundId)
        .single()
      setRound((data as AssignmentRound) ?? null)
    }

    void load()

    const channel = supabase
      .channel(`round-${roundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignment_rounds',
          filter: `id=eq.${roundId}`,
        },
        (payload) => {
          setRound(payload.new as AssignmentRound)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId])

  return round
}

export function useRealtimeAssignments(roundId: string | null) {
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    if (!roundId) {
      setAssignments([])
      return
    }

    const load = async () => {
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('round_id', roundId)
        .order('assigned_at')
      setAssignments((data as Assignment[]) ?? [])
    }

    void load()

    const channel = supabase
      .channel(`assignments-${roundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `round_id=eq.${roundId}`,
        },
        () => {
          void load()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId])

  return assignments
}

export function useRealtimeWaitlist(roundId: string | null) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])

  useEffect(() => {
    if (!roundId) {
      setWaitlist([])
      return
    }

    const load = async () => {
      const { data } = await supabase
        .from('waitlist')
        .select('*')
        .eq('round_id', roundId)
        .order('position')
      setWaitlist((data as WaitlistEntry[]) ?? [])
    }

    void load()

    const channel = supabase
      .channel(`waitlist-${roundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waitlist',
          filter: `round_id=eq.${roundId}`,
        },
        () => {
          void load()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId])

  return waitlist
}

export function useRealtimeLotteryEvents(roundId: string | null) {
  const [events, setEvents] = useState<LotteryEvent[]>([])

  useEffect(() => {
    if (!roundId) {
      setEvents([])
      return
    }

    const load = async () => {
      const { data } = await supabase
        .from('lottery_events')
        .select('*')
        .eq('round_id', roundId)
        .order('created_at')
      setEvents((data as LotteryEvent[]) ?? [])
    }

    void load()

    const channel = supabase
      .channel(`lottery-${roundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lottery_events',
          filter: `round_id=eq.${roundId}`,
        },
        () => {
          void load()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId])

  return events
}
