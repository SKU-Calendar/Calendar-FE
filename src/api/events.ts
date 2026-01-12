/**
 * 일정 관련 API 함수
 */
import { api } from './client';
import { API_ENDPOINTS, USE_MOCK_API } from './config';
import { getUser } from '@/utils/storage';
import {
  mockGetEvents,
  mockCreateEvent,
  mockUpdateEvent,
  mockDeleteEvent,
} from './mock';

export type Event = {
  id: string;
  calendar_id?: string; // 캘린더 ID (ERD 참고)
  created_by?: string; // 생성한 사용자 ID
  title: string;
  date: string; // ISO string (yyyy-mm-dd) - 호환성을 위해 유지
  start_at?: string; // TIMESTAMP 형식 시작 일시 (ERD 참고)
  end_at?: string; // TIMESTAMP 형식 종료 일시 (ERD 참고)
  description?: string;
  status?: string; // 일정 상태 (ERD 참고)
  color?: string; // 색상 코드 (예: '#4caf50', '#9c27b0' 등)
  createdAt?: string;
  updatedAt?: string;
  deleted_at?: string; // 삭제일자 (soft delete)
};

export type CreateEventRequest = {
  calendar_id?: string; // 캘린더 ID (선택)
  title: string;
  date: string; // ISO string (yyyy-mm-dd)
  start_at?: string; // TIMESTAMP 형식 시작 일시
  end_at?: string; // TIMESTAMP 형식 종료 일시
  description?: string;
  status?: string; // 일정 상태
  color?: string; // 색상 코드
};

export type UpdateEventRequest = Partial<CreateEventRequest>;

/**
 * 캘린더 조회 (GET /api/calender)
 */
export const getCalendar = async (): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    return await mockGetEvents(undefined, undefined);
  }

  // 실제 API 호출
  return await api.get<any>(API_ENDPOINTS.CALENDAR.LIST);
};

/**
 * 캘린더 상세 조회 (GET /api/calender/{date_id})
 */
export const getCalendarDetail = async (dateId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    return await mockGetEvents(dateId, dateId);
  }

  // 실제 API 호출
  const endpoint = API_ENDPOINTS.CALENDAR.DETAIL.replace(':date_id', dateId);
  return await api.get<any>(endpoint);
};

/**
 * 일정 목록 조회 (기존 호환성을 위한 함수)
 * @param startDate 시작 날짜 (선택, YYYY-MM-DD)
 * @param endDate 종료 날짜 (선택, YYYY-MM-DD)
 */
export const getEvents = async (
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean;
  data?: Event[];
  error?: string;
}> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    return await mockGetEvents(startDate, endDate);
  }

  // 실제 API 호출 - 캘린더 조회 사용
  return await api.get<Event[]>(API_ENDPOINTS.CALENDAR.LIST);
};

/**
 * 특정 날짜의 일정 조회 (TIMESTAMP 기반, ERD 참고)
 * events 테이블에서 start_at이 해당 날짜 범위에 있는 일정 조회
 */
export const getEventsByDate = async (date: string): Promise<{
  success: boolean;
  data?: Event[];
  error?: string;
}> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    return await mockGetEvents(date, date);
  }

  // 실제 API 호출 - 캘린더 상세 조회 사용 (date_id는 YYYY-MM-DD 형식)
  const dateId = date; // 또는 date.replace(/-/g, '') 형식일 수 있음
  const endpoint = API_ENDPOINTS.CALENDAR.DETAIL.replace(':date_id', dateId);
  return await api.get<Event[]>(endpoint);
};

/**
 * 일정 생성 (POST /api/calender/{user_id}/{calender_id})
 */
export const createEvent = async (
  eventData: CreateEventRequest
): Promise<{
  success: boolean;
  data?: Event;
  error?: string;
}> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    return await mockCreateEvent(eventData);
  }

  // 실제 API 호출
  const user = await getUser();
  if (!user || !user.id) {
    return {
      success: false,
      error: '사용자 정보를 찾을 수 없습니다.',
    };
  }

  // calender_id는 이벤트 ID 또는 날짜 기반으로 생성 (실제 백엔드에 따라 다를 수 있음)
  const calenderId = eventData.date.replace(/-/g, ''); // YYYYMMDD 형식

  const endpoint = API_ENDPOINTS.CALENDAR.EVENT_CREATE
    .replace(':user_id', user.id)
    .replace(':calender_id', calenderId);

  return await api.post<Event>(endpoint, eventData);
};

/**
 * 일정 수정 (PATCH /api/calender/{user_id}/{calender_id})
 */
export const updateEvent = async (
  id: string,
  eventData: UpdateEventRequest
): Promise<{
  success: boolean;
  data?: Event;
  error?: string;
}> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    return await mockUpdateEvent(id, eventData);
  }

  // 실제 API 호출
  const user = await getUser();
  if (!user || !user.id) {
    return {
      success: false,
      error: '사용자 정보를 찾을 수 없습니다.',
    };
  }

  // calender_id는 이벤트 ID 사용 (실제 백엔드에 따라 다를 수 있음)
  const endpoint = API_ENDPOINTS.CALENDAR.EVENT_UPDATE
    .replace(':user_id', user.id)
    .replace(':calender_id', id);

  return await api.patch<Event>(endpoint, eventData);
};

/**
 * 일정 삭제 (DELETE /api/calender/{user_id}/{calender_id})
 */
export const deleteEvent = async (id: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    return await mockDeleteEvent(id);
  }

  // 실제 API 호출
  const user = await getUser();
  if (!user || !user.id) {
    return {
      success: false,
      error: '사용자 정보를 찾을 수 없습니다.',
    };
  }

  // calender_id는 이벤트 ID 사용 (실제 백엔드에 따라 다를 수 있음)
  const endpoint = API_ENDPOINTS.CALENDAR.EVENT_DELETE
    .replace(':user_id', user.id)
    .replace(':calender_id', id);

  return await api.delete(endpoint);
};
