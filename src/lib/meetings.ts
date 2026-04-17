export const MEETING_DURATION_MINUTES = 30;
export const MEETING_START_HOUR = 10;
export const MEETING_END_HOUR = 18;

export type MeetingStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';

export type MeetingSlot = {
  slotKey: string;
  dateKey: string;
  startMinutes: number;
  endMinutes: number;
  startTime: string;
  endTime: string;
};

export function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function dateKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function timeLabelFromMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${pad(minutes)} ${suffix}`;
}

export function buildSlotsForDate(dateKey: string) {
  const slots: MeetingSlot[] = [];

  for (
    let minutes = MEETING_START_HOUR * 60;
    minutes + MEETING_DURATION_MINUTES <= MEETING_END_HOUR * 60;
    minutes += MEETING_DURATION_MINUTES
  ) {
    slots.push({
      slotKey: `${dateKey}_${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}`,
      dateKey,
      startMinutes: minutes,
      endMinutes: minutes + MEETING_DURATION_MINUTES,
      startTime: timeLabelFromMinutes(minutes),
      endTime: timeLabelFromMinutes(minutes + MEETING_DURATION_MINUTES),
    });
  }

  return slots;
}

export function buildUpcomingDates(startDate: Date = new Date(), days = 14) {
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  while (dates.length < days) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 6;

    if (!isWeekend) {
      dates.push(new Date(cursor));
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function prettyDateLabel(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

