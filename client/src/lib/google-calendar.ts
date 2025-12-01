export interface CalendarEvent {
  id: string;
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

export interface AvailabilityResponse {
  available: boolean;
  bookedDates: string[];
}

export async function checkAvailability(startDate: string, endDate: string): Promise<AvailabilityResponse> {
  try {
    const response = await fetch(`/api/availability?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      throw new Error('Failed to check availability');
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking availability:', error);
    return { available: true, bookedDates: [] };
  }
}

export function formatDateForCalendar(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isDateAvailable(date: Date, bookedDates: string[]): boolean {
  const dateString = formatDateForCalendar(date);
  return !bookedDates.includes(dateString);
}
