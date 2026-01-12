/**
 * 인증 관련 API 함수
 */
import { api } from './client';
import { API_ENDPOINTS, USE_MOCK_API } from './config';
import { saveToken, saveRefreshToken, saveUser, clearAuth } from '@/utils/storage';
import { mockLogin, mockSignup } from './mock';

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
  refreshToken?: string;
};

/**
 * 로그인
 */
export const login = async (credentials: LoginRequest): Promise<{
  success: boolean;
  data?: AuthResponse;
  error?: string;
}> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    const response = await mockLogin(credentials.email, credentials.password);
    if (response.success && response.data) {
      await saveToken(response.data.accessToken);
      if (response.data.refreshToken) {
        await saveRefreshToken(response.data.refreshToken);
      }
      await saveUser(response.data.user);
    }
    return response;
  }

  // 실제 API 호출
  const response = await api.post<AuthResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials,
    false // 로그인은 인증 불필요
  );

  if (response.success && response.data) {
    // 토큰 저장
    await saveToken(response.data.accessToken);
    if (response.data.refreshToken) {
      await saveRefreshToken(response.data.refreshToken);
    }
    // 사용자 정보 저장
    await saveUser(response.data.user);
  }

  return response;
};

/**
 * 회원가입
 */
export const signup = async (data: SignupRequest): Promise<{
  success: boolean;
  data?: AuthResponse;
  error?: string;
}> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    const response = await mockSignup(data.email, data.password);
    if (response.success && response.data) {
      await saveToken(response.data.accessToken);
      if (response.data.refreshToken) {
        await saveRefreshToken(response.data.refreshToken);
      }
      await saveUser(response.data.user);
    }
    return response;
  }

  // 실제 API 호출
  const response = await api.post<AuthResponse>(
    API_ENDPOINTS.AUTH.SIGNUP,
    data,
    false // 회원가입은 인증 불필요
  );

  if (response.success && response.data) {
    // 회원가입 후 자동 로그인 처리
    await saveToken(response.data.accessToken);
    if (response.data.refreshToken) {
      await saveRefreshToken(response.data.refreshToken);
    }
    await saveUser(response.data.user);
  }

  return response;
};

/**
 * 로그아웃
 */
export const logout = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  // 모킹 모드일 때는 서버 호출 생략
  if (!USE_MOCK_API) {
    try {
      // 서버에 로그아웃 요청 (선택사항)
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    }
  }

  // 로컬 저장소에서 인증 정보 삭제
  await clearAuth();

  return { success: true };
};

/**
 * 토큰 새로고침 (리프레시 토큰 사용)
 */
export const refreshToken = async (): Promise<{
  success: boolean;
  data?: { accessToken: string };
  error?: string;
}> => {
  const response = await api.post<{ accessToken: string }>(
    API_ENDPOINTS.AUTH.REFRESH,
    {},
    false
  );

  if (response.success && response.data) {
    await saveToken(response.data.accessToken);
  }

  return response;
};
