# API 서버 연결 설정 가이드

API 요청 실패 문제를 해결하기 위한 설정 가이드입니다.

## 문제 원인

React Native/Expo 앱에서 `localhost`는 실행 환경에 따라 다르게 동작합니다:
- **iOS 시뮬레이터**: `localhost` 사용 가능
- **Android 에뮬레이터**: `10.0.2.2` 사용 필요
- **실제 기기**: 컴퓨터의 IP 주소 사용 필요

## 해결 방법

### 1. 컴퓨터의 IP 주소 확인

터미널에서 다음 명령어를 실행하세요:

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

일반적으로 `192.168.x.x` 형태의 주소를 찾으면 됩니다.

### 2. API 주소 설정

`src/api/config.ts` 파일을 열어서 IP 주소를 설정하세요:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3000/api' // 여기에 본인의 IP 주소 입력
  : 'https://your-api-domain.com/api';
```

**예시:**
- IP 주소가 `192.168.0.5`이고 백엔드 서버가 3000번 포트를 사용한다면:
  ```
  http://192.168.0.5:3000/api
  ```

### 3. 백엔드 서버가 실행 중인지 확인

백엔드 서버가 실행 중이어야 합니다:
```bash
# 백엔드 서버 실행 (예시)
npm start
# 또는
node server.js
```

### 4. 방화벽 설정 확인

컴퓨터의 방화벽이 3000번 포트를 차단하지 않는지 확인하세요.

### 5. 네트워크 확인

- 컴퓨터와 기기가 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다
- VPN을 사용 중이라면 끄고 시도해보세요

## 환경별 설정 예시

### iOS 시뮬레이터
```typescript
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://your-api-domain.com/api';
```

### Android 에뮬레이터
```typescript
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api'
  : 'https://your-api-domain.com/api';
```

### 실제 기기 (iPhone/Android)
```typescript
export const API_BASE_URL = __DEV__
  ? 'http://192.168.0.5:3000/api' // 컴퓨터의 IP 주소
  : 'https://your-api-domain.com/api';
```

## 설정 변경 후

1. 앱을 완전히 종료
2. Expo 개발 서버 재시작:
   ```bash
   npm start
   ```
3. 앱 다시 실행

## 문제가 계속되면

1. 백엔드 서버가 정상적으로 실행 중인지 확인
2. 브라우저에서 `http://[IP주소]:3000/api/health` (또는 유사한 엔드포인트) 접속 테스트
3. 터미널에서 백엔드 서버 로그 확인
