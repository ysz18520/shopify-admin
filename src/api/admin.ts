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

// === 文件管理 ===

export function updateStoreUploadConfig(
  name: string,
  data: { maxFileSize?: number; allowedFileTypes?: string }
): Promise<any> {
  return request.put(`/admin/stores/${name}`, data) as Promise<any>;
}

// === 报价管理 ===

export interface QuoteRecord {
  id: string;
  site: string;
  formData: Record<string, string>;
  fileId: string | null;
  fileUrl: string | null;
  fileName: string | null;
  status: string;
  createdAt: string;
}

export interface QuoteListResponse {
  quotes: QuoteRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export function getQuoteList(page = 1, pageSize = 20, site?: string): Promise<QuoteListResponse> {
  return request.get('/admin/quotes', {
    params: { page, pageSize, site },
  }) as Promise<QuoteListResponse>;
}

export function updateQuoteStatus(id: string, status: string, site?: string): Promise<any> {
  return request.put(`/admin/quotes/${id}/status`, { status }, {
    params: { site },
  }) as Promise<any>;
}

export function deleteQuote(id: string, site?: string): Promise<{ success: boolean }> {
  return request.delete(`/admin/quotes/${id}`, {
    params: { site },
  }) as Promise<{ success: boolean }>;
}

export function downloadQuoteFile(id: string, site?: string): Promise<{ downloadUrl: string; fileName: string }> {
  return request.get(`/admin/quotes/${id}/download`, {
    params: { site },
  }) as Promise<{ downloadUrl: string; fileName: string }>;
}

// === 表单选项管理 ===

export interface FormOptionRecord {
  id: string;
  site: string;
  fieldKey: string;
  label: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
}

export function getFormOptions(site?: string): Promise<FormOptionRecord[]> {
  return request.get('/admin/form-options', {
    params: { site },
  }) as Promise<FormOptionRecord[]>;
}

export function createFormOption(data: {
  site: string;
  fieldKey: string;
  label: string;
  value: string;
}): Promise<FormOptionRecord> {
  return request.post('/admin/form-options', data) as Promise<FormOptionRecord>;
}

export function updateFormOption(
  id: string,
  data: { label?: string; value?: string; sortOrder?: number; isActive?: boolean }
): Promise<FormOptionRecord> {
  return request.put(`/admin/form-options/${id}`, data) as Promise<FormOptionRecord>;
}

export function deleteFormOption(id: string): Promise<{ success: boolean }> {
  return request.delete(`/admin/form-options/${id}`) as Promise<{ success: boolean }>;
}
