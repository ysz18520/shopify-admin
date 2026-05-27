import request from './request';

export interface AdminLoginResponse {
  token: string;
  username: string;
  role: 'super' | 'site';
  site: string;
}

export interface BookingRecord {
  id: string;
  site: string;
  startTime: string;
  endTime: string;
  duration: number;
  lastName: string;
  firstName: string | null;
  email: string | null;
  company: string;
  phone: string;
  meetingType: string;
  userTimezone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingListResponse {
  items: BookingRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatsResponse {
  today: number;
  week: number;
  month: number;
  pending: number;
  total: number;
}

export interface AvailabilityConfigItem {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface BreakConfigItem {
  startTime: string;
  endTime: string;
}

export interface AvailabilityResponse {
  availability: AvailabilityConfigItem[];
  breaks: BreakConfigItem[];
}

export interface HolidayRecord {
  id: string;
  site: string;
  date: string;
  reason: string | null;
  createdAt: string;
}

export function login(username: string, password: string): Promise<AdminLoginResponse> {
  return request.post('/admin/login', { username, password }) as Promise<AdminLoginResponse>;
}

export function getBookings(page = 1, pageSize = 10, status?: string, site?: string): Promise<BookingListResponse> {
  return request.get('/admin/bookings', {
    params: { page, pageSize, status, site },
  }) as Promise<BookingListResponse>;
}

export function cancelBooking(id: string, site?: string): Promise<BookingRecord> {
  return request.put(`/admin/bookings/${id}/cancel`, null, {
    params: { site },
  }) as Promise<BookingRecord>;
}

export function getStats(site?: string): Promise<StatsResponse> {
  return request.get('/admin/stats', {
    params: { site },
  }) as Promise<StatsResponse>;
}

export function getAvailability(site?: string): Promise<AvailabilityResponse> {
  return request.get('/admin/availability', {
    params: { site },
  }) as Promise<AvailabilityResponse>;
}

export function saveAvailability(
  availability: AvailabilityConfigItem[],
  breaks: BreakConfigItem[],
  site?: string
): Promise<{ success: boolean }> {
  return request.put('/admin/availability', { availability, breaks }, {
    params: { site },
  }) as Promise<{ success: boolean }>;
}

export function getHolidays(site?: string): Promise<HolidayRecord[]> {
  return request.get('/admin/holidays', {
    params: { site },
  }) as Promise<HolidayRecord[]>;
}

export function addHoliday(date: string, reason?: string, site?: string): Promise<HolidayRecord> {
  return request.post('/admin/holidays', { date, reason }, {
    params: { site },
  }) as Promise<HolidayRecord>;
}

export function removeHoliday(id: string, site?: string): Promise<{ success: boolean }> {
  return request.delete(`/admin/holidays/${id}`, {
    params: { site },
  }) as Promise<{ success: boolean }>;
}
