/**
 * AI 챗봇 API 클라이언트
 * 백엔드 서버를 통해 OpenAI API를 호출합니다
 */

import { api } from './client';
import { API_ENDPOINTS, USE_MOCK_API } from './config';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ParsedEvent = {
  title: string;
  date: string; // YYYY-MM-DD
  description?: string;
};

export type ChatResponse = {
  success: boolean;
  message?: string;
  events?: ParsedEvent[];
  error?: string;
};

export type ChatRequest = {
  message: string; // 사용자 메시지
  conversationHistory?: ChatMessage[]; // 대화 히스토리 (선택사항)
};

/**
 * 채팅 전송 (POST /api/chats/{chat_id})
 */
export const sendChat = async (
  chatId: string,
  request: ChatRequest
): Promise<ChatResponse> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    const { mockChatWithAI } = await import('./mock');
    return await mockChatWithAI(request);
  }

  // 실제 API 호출
  const endpoint = API_ENDPOINTS.CHAT.SEND.replace(':chat_id', chatId);
  return await api.post<ChatResponse>(endpoint, request, true);
};

/**
 * 채팅 조회 (GET /api/chats/{chat_id})
 */
export const getChat = async (chatId: string): Promise<ChatResponse> => {
  // 모킹 모드일 때
  if (USE_MOCK_API) {
    const { mockChatWithAI } = await import('./mock');
    return await mockChatWithAI({ message: '' });
  }

  // 실제 API 호출
  const endpoint = API_ENDPOINTS.CHAT.GET.replace(':chat_id', chatId);
  return await api.get<ChatResponse>(endpoint, true);
};

/**
 * 백엔드 API를 통한 챗봇 응답 생성 (기존 호환성을 위한 함수)
 * @deprecated sendChat 사용 권장
 */
export const chatWithAI = async (
  request: ChatRequest
): Promise<ChatResponse> => {
  // 기본 chat_id 사용 (실제로는 사용자별 또는 세션별 ID 사용)
  const chatId = 'default';
  return await sendChat(chatId, request);
};

