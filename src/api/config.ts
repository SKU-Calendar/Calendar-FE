/**
 * API 설정 파일
 * 백엔드 서버의 base URL을 여기에 설정합니다.
 */

// ========================================
// 🎯 모킹 모드 설정 (백엔드 없이 테스트)
// ========================================
// true로 설정하면 백엔드 서버 없이 로컬 스토리지(AsyncStorage)를 사용합니다
// false로 설정하면 실제 백엔드 서버를 사용합니다
export const USE_MOCK_API = true; // ⚠️ 백엔드 없이 테스트하려면 true로 설정하세요!

// ========================================
// 백엔드 서버 URL 설정 (USE_MOCK_API가 false일 때 사용)
// ========================================
// ⚠️ 중요: 실제 기기에서 실행하는 경우 localhost 대신 컴퓨터의 IP 주소를 사용해야 합니다!
// 예: http://192.168.0.5:3000/api
// IP 주소 확인: ifconfig (macOS/Linux) 또는 ipconfig (Windows)
// 
// 환경별 설정:
// - iOS 시뮬레이터: http://localhost:3000/api
// - Android 에뮬레이터: http://10.0.2.2:3000/api
// - 실제 기기: http://[컴퓨터IP주소]:3000/api
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api' // ⚠️ 실제 기기 사용 시 IP 주소로 변경 필요! (예: http://192.168.0.5:3000/api)
  : 'https://your-api-domain.com/api'; // 프로덕션 서버

// 환경 변수로 설정하려면 아래처럼 사용할 수도 있습니다:
// export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  // 캘린더/일정
  CALENDAR: {
    LIST: '/calendar', // GET /api/calendar
    BY_ID: '/calendar/:calendar_id', // GET /api/calendar/{calendar_id}
    BY_DATE: '/calendar/:calendar_id/day/:date', // GET /api/calendar/{calendarId}/day/{date}
    EVENT_CREATE: '/calendar/:user_id/:calendar_id', // POST /api/calendar/{user_id}/{calendar_id}
    EVENT_GET: '/calendar/:user_id/:calendar_id', // GET /api/calendar/{user_id}/{calendar_id}
    EVENT_UPDATE: '/calendar/:user_id/:calendar_id', // PATCH /api/calendar/{user_id}/{calendar_id}
    EVENT_DELETE: '/calendar/:user_id/:calendar_id', // DELETE /api/calendar/{user_id}/{calendar_id}
  },
  // 이벤트 슬롯
  EVENT_SLOTS: {
    CREATE: '/event-slots', // POST /api/event-slots
    DELETE: '/event-slots/:slot_id', // DELETE /api/event-slots/{slot_id}
    UPDATE: '/event-slots/:slot_id', // PATCH /api/event-slots/{slot_id}
    UPDATE_DONE: '/event-slots/:slot_id/done', // PATCH /api/event-slots/{slot_id}/done
  },
  // 채팅 (API 문서에 따르면 /api/chats/{chat_id} 사용)
  CHAT: {
    SEND: '/chats/:chat_id', // POST
    GET: '/chats/:chat_id', // GET
  },
} as const;
