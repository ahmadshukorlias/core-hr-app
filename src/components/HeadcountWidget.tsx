'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Row = { department_name: string; headcount: number }

export function HeadcountWidget({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial)

  useEffect(() => {
    const supabase = createClient()
    const interval = setInterval(async () => {
      const { data } = await supabase.rpc('get_headcount_stats')
      if (data) setRows(data)
    }, 20000)
    return () => clearInterval(interval)
  }, [])

  const total = rows.reduce((sum, r) => sum + Number(r.headcount), 0)

  return (
    <div className="rounded-xl border border-[#E3E8EB] bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-[#1E293B]">Active Headcount</h3>
        <span className="flex items-center gap-1.5 text-[11px] text-[#5B6670]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4FA3A0]" />Live
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-[#0E4A56]">{total}</p>
      <p className="text-xs text-[#5B6670]">employees currently active</p>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.department_name} className="flex items-center justify-between text-sm">
            <span className="text-[#5B6670]">{r.department_name}</span>
            <span className="font-medium text-[#1E293B]">{r.headcount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}