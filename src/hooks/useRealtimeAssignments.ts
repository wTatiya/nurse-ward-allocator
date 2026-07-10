import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type {
  Assignment,
  AssignmentRound,
  LotteryEvent,
  Preference,
  RoundStatus,
  WaitlistEntry,
} from '../types/database'

export function statusFilterFromKey(statusesKey: string): RoundStatus[] {
  if (!statusesKey) return []
  return statusesKey.split('\0') as RoundStatus[]
}

export function useRealtimeRoundsList(statuses?: RoundStatus[]) {
  const [rounds, setRounds] = useState<AssignmentRound[]>([])
  const statusesKey = statuses?.join('\0') ?? ''

  const refetch = useCallback(async () => {
    let query = supabase
      .from('assignment_rounds')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    const statusFilter = statusFilterFromKey(statusesKey)
    if (statusFilter.length > 0) {
      query = query.in('status', statusFilter)
    }

    const { data } = await query
    setRounds((data as AssignmentRound[]) ?? [])
  }, [statusesKey])

  useEffect(() => {
    void refetch()

    const channel = supabase
      .channel('assignment-rounds-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignment_rounds',
        },
        () => {
          void refetch()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refetch])

  return { rounds, refetch }
}

export function useRealtimeRound(roundId: string | null) {
  const [round, setRound] = useState<AssignmentRound | null>(null)

  const load = useCallback(async () => {
    if (!roundId) {
      setRound(null)
      return
    }

    const { data } = await supabase
      .from('assignment_rounds')
      .select('*')
      .eq('id', roundId)
      .single()
    setRound((data as AssignmentRound) ?? null)
  }, [roundId])

  useEffect(() => {
    void load()

    if (!roundId) return

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
        () => {
          void load()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId, load])

  return round
}

export function useRealtimeAssignments(roundId: string | null) {
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const refetch = useCallback(async () => {
    if (!roundId) {
      setAssignments([])
      return
    }

    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('round_id', roundId)
      .order('assigned_at')
    setAssignments((data as Assignment[]) ?? [])
  }, [roundId])

  useEffect(() => {
    void refetch()

    if (!roundId) return

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
          void refetch()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId, refetch])

  return { assignments, refetch }
}

export function useRealtimeWaitlist(roundId: string | null) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])

  const refetch = useCallback(async () => {
    if (!roundId) {
      setWaitlist([])
      return
    }

    const { data } = await supabase
      .from('waitlist')
      .select('*')
      .eq('round_id', roundId)
      .order('position')
    setWaitlist((data as WaitlistEntry[]) ?? [])
  }, [roundId])

  useEffect(() => {
    void refetch()

    if (!roundId) return

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
          void refetch()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId, refetch])

  return { waitlist, refetch }
}

export function useRealtimeLotteryEvents(roundId: string | null) {
  const [events, setEvents] = useState<LotteryEvent[]>([])

  const refetch = useCallback(async () => {
    if (!roundId) {
      setEvents([])
      return
    }

    const { data } = await supabase
      .from('lottery_events')
      .select('*')
      .eq('round_id', roundId)
      .order('created_at')
    setEvents((data as LotteryEvent[]) ?? [])
  }, [roundId])

  useEffect(() => {
    void refetch()

    if (!roundId) return

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
          void refetch()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId, refetch])

  return events
}

export function useRealtimePreferences(roundId: string | null) {
  const [preferences, setPreferences] = useState<Preference[]>([])

  const refetch = useCallback(async () => {
    if (!roundId) {
      setPreferences([])
      return
    }

    const { data } = await supabase
      .from('preferences')
      .select('*')
      .eq('round_id', roundId)
      .order('submitted_at')
    setPreferences((data as Preference[]) ?? [])
  }, [roundId])

  useEffect(() => {
    void refetch()

    if (!roundId) return

    const channel = supabase
      .channel(`preferences-${roundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'preferences',
          filter: `round_id=eq.${roundId}`,
        },
        () => {
          void refetch()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roundId, refetch])

  return preferences
}
