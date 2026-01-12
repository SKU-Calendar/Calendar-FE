/**
 * API 클라이언트
 * 백엔드와 통신하는 기본 HTTP 클라이언트
 */
import { API_BASE_URL, USE_MOCK_API } from './config';
import { getToken, clearAuth } from '@/utils/storage';

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

/**
 * API 요청 옵션
 */
type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean; // 인증이 필요한 요청인지
};

/**
 * API 요청 함수
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    headers = {},
    body,
    requiresAuth = true,
  } = options;

  try {
    // 모킹 모드일 때는 실제 API 호출하지 않음 (각 API 함수에서 처리)
    if (USE_MOCK_API) {
      // 모킹 모드에서는 여기서는 처리하지 않고 각 API 함수(mock.ts)에서 처리
      // 실제 API 호출은 하지 않지만 타입 호환성을 위해 빈 응답 반환
      return {
        success: false,
        error: '모킹 모드: API 클라이언트를 직접 사용하지 마세요. 각 API 함수를 사용하세요.',
      };
    }

    // URL 구성
    const url = `${API_BASE_URL}${endpoint}`;

    // 헤더 설정
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // 인증이 필요한 경우 토큰 추가
    if (requiresAuth) {
      const token = await getToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // 요청 옵션
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // body가 있으면 JSON으로 변환
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    // API 호출
    const response = await fetch(url, requestOptions);
    const responseData = await response.json();

    // 401 Unauthorized - 토큰 만료 또는 인증 실패
    if (response.status === 401) {
      await clearAuth();
      // 로그인 화면으로 리다이렉트하는 로직은 네비게이션에서 처리
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    // 에러 응답 처리
    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || responseData.error || '요청에 실패했습니다.',
        data: responseData,
      };
    }

    // 성공 응답
    return {
      success: true,
      data: responseData.data || responseData,
      message: responseData.message,
    };
  } catch (error: any) {
    console.error('API 요청 실패:', error);
    return {
      success: false,
      error: error.message || '네트워크 오류가 발생했습니다.',
    };
  }
};

/**
 * 편의 함수들
 */
export const api = {
  get: <T = any>(endpoint: string, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'GET', requiresAuth }),

  post: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'POST', body, requiresAuth }),

  put: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, requiresAuth }),

  delete: <T = any>(endpoint: string, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'DELETE', requiresAuth }),

  patch: <T = any>(endpoint: string, body?: any, requiresAuth = true) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, requiresAuth }),
};
