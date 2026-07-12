'use client'

import { useState, useMemo, useRef } from 'react'

type Holiday = { id: string; name: string; date: string }
type LeaveEvent = {
  start_date: string
  end_date: string
  status: string
  is_half_day: boolean
  leave_types: { name: string } | null
  profiles?: { full_name: string } | null
}

export function CalendarView({
  holidays,
  leaveRequests,
  onDateClick,
}: {
  holidays: Holiday[]
  leaveRequests: LeaveEvent[]
  onDateClick?: (date: string) => void
}) {
  const [cursor, setCursor] = useState(new Date())
  const touchStartX = useRef<number | null>(null)

  const holidayMap = useMemo(() => {
    const m = new Map<string, string>()
    holidays.forEach((h) => m.set(h.date, h.name))
    return m
  }, [holidays])

  const eventMap = useMemo(() => {
    const m = new Map<string, LeaveEvent[]>()
    leaveRequests.forEach((lr) => {
      let d = new Date(lr.start_date)
      const end = new Date(lr.end_date)
      while (d <= end) {
        const key = d.toISOString().split('T')[0]
        if (!m.has(key)) m.set(key, [])
        m.get(key)!.push(lr)
        d = new Date(d.getTime() + 86400000)
      }
    })
    return m
  }, [leaveRequests])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = new Date(year, month, 1).getDay()
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const changeMonth = (delta: number) => setCursor(new Date(year, month + delta, 1))
  const isoDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const isWeekend = (day: number) => [0, 6].includes(new Date(year, month, day).getDay())
  const todayStr = new Date().toISOString().split('T')[0]

  function eventStyle(events: LeaveEvent[] | undefined) {
    if (!events || events.length === 0) return null
    const approved = events.find((e) => e.status === 'approved')
    const primary = approved ?? events[0]
    if (primary.status === 'pending') return { label: 'Pending', color: '#F5A623', bg: 'bg-[#F5A623]/10' }
    if (primary.is_half_day) return { label: 'Half-day', color: '#7FB9B6', bg: 'bg-[#7FB9B6]/15' }
    return { label: 'Full-day', color: '#3D6E93', bg: 'bg-[#3D6E93]/10' }
  }

  return (
    <div
      className="rounded-xl border border-[#E3E8EB] bg-white p-4"
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const delta = e.changedTouches[0].clientX - touchStartX.current
        if (delta > 50) changeMonth(-1)
        if (delta < -50) changeMonth(1)
        touchStartX.current = null
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="rounded-lg px-3 py-1.5 text-sm hover:bg-[#F7F9FA] active:scale-95">←</button>
        <h2 className="font-display text-sm font-semibold text-[#1E293B]">
          {cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="rounded-lg px-3 py-1.5 text-sm hover:bg-[#F7F9FA] active:scale-95">→</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#5B6670]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1 font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const date = isoDate(day)
          const holidayName = holidayMap.get(date)
          const events = eventMap.get(date)
          const style = eventStyle(events)
          const weekend = isWeekend(day)
          const clickable = !!onDateClick && !holidayName && !weekend

          return (
            <button
              key={i}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onDateClick!(date)}
              className={`relative min-h-[46px] rounded-lg p-1 text-left text-xs sm:min-h-[60px]
                ${holidayName ? 'bg-[#4FA3A0]/10' : style ? style.bg : weekend ? 'bg-[#F7F9FA]' : ''}
                ${date === todayStr ? 'ring-2 ring-[#0E4A56]' : ''}
                ${clickable ? 'hover:ring-1 hover:ring-[#3D6E93] cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`font-medium ${weekend ? 'text-[#5B6670]' : 'text-[#1E293B]'}`}>{day}</span>
              {holidayName && (
                <p className="mt-0.5 truncate text-[9px] font-medium text-[#0E4A56]" title={holidayName}>{holidayName}</p>
              )}
              {style && (
                <p className="mt-0.5 truncate text-[9px] font-medium" style={{ color: style.color }}>{style.label}</p>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-center text-[11px] text-[#5B6670] md:hidden">← swipe to change month →</p>

      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[#5B6670]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#4FA3A0]" />Public holiday</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#F5A623]" />Pending</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#3D6E93]" />Full-day approved</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7FB9B6]" />Half-day approved</span>
      </div>
      {onDateClick && <p className="mt-2 text-[11px] text-[#5B6670]">Tap a working day to request leave.</p>}
    </div>
  )
}