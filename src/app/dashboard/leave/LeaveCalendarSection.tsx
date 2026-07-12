'use client'

import { useRef, useState } from 'react'
import { CalendarView } from '@/components/CalendarView'
import { requestLeave } from './actions'

type LeaveType = { id: string; name: string }
type LeaveEvent = {
  start_date: string; end_date: string; status: string; is_half_day: boolean
  leave_types: { name: string } | null
}

export function LeaveCalendarSection({
  leaveTypes, myLeaveEvents, holidays,
}: { leaveTypes: LeaveType[]; myLeaveEvents: LeaveEvent[]; holidays: { id: string; name: string; date: string }[] }) {
  const [selectedDate, setSelectedDate] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleDateClick(date: string) {
    setSelectedDate(date)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CalendarView holidays={holidays} leaveRequests={myLeaveEvents} onDateClick={handleDateClick} />

      <form ref={formRef} action={requestLeave} className="space-y-3 rounded-xl border border-[#E3E8EB] bg-white p-4">
        <h2 className="font-display text-sm font-semibold text-[#1E293B]">Request Leave</h2>

        <div>
          <label className="block text-sm font-medium text-[#5B6670]">Leave Type</label>
          <select name="leave_type_id" required className="mt-1 w-full rounded-lg border border-[#E3E8EB] p-2 text-sm">
            {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#5B6670]">Start Date</label>
            <input
              name="start_date" type="date" required
              value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E3E8EB] p-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#5B6670]">End Date</label>
            <input name="end_date" type="date" defaultValue={selectedDate} className="mt-1 w-full rounded-lg border border-[#E3E8EB] p-2 text-sm" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[#5B6670]">
          <input type="checkbox" name="is_half_day" />
          Half-day only (uses only the Start Date above)
        </label>

        <div>
          <label className="block text-sm font-medium text-[#5B6670]">Reason (optional)</label>
          <textarea name="reason" rows={2} className="mt-1 w-full rounded-lg border border-[#E3E8EB] p-2 text-sm" />
        </div>

        <button type="submit" className="w-full rounded-lg bg-[#0E4A56] py-2.5 text-sm font-medium text-white hover:-translate-y-px">
          Submit Request
        </button>
        {selectedDate && <p className="text-center text-xs text-[#4FA3A0]">Selected: {selectedDate}</p>}
      </form>
    </div>
  )
}