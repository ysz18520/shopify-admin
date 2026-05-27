import request from './request';

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
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function getBookingList() {
  // 暂时用后端已有的接口，后续补充管理端专用列表接口
  return request.get('/coollaa/booking/config');
}

export function getConfig() {
  return request.get('/coollaa/booking/config');
}
