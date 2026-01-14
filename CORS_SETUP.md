# CORS 설정 가이드 (백엔드 개발자용)

## 프론트엔드 주소 정보

### 현재 프론트엔드 환경
- **프레임워크**: React Native + Expo
- **배포 상태**: 개발 중 (아직 프로덕션 배포 없음)

### 개발 환경 주소

**중요: 4개를 모두 쓸 필요 없습니다!**

가장 간단한 방법은 **개발 환경에서 모든 Origin 허용 (`*`)**입니다.

Expo는 다양한 포트를 사용할 수 있으므로, 
개발 환경에서는 localhost의 모든 포트를 허용하거나 `*`를 사용하는 것을 권장합니다.

### 프로덕션 환경 (향후 배포 예정)
- 아직 프로덕션 배포가 없으므로, 배포 후 주소를 추가로 알려드리겠습니다.

## 백엔드 CORS 설정 권장사항

### ⭐ 가장 간단한 방법 (권장)
**개발 환경에서는 모든 Origin 허용:**
```javascript
// 개발 환경
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: '*', // 모든 Origin 허용
    credentials: true,
  }));
}
```

### 옵션 1: localhost 전체 허용
```javascript
// localhost의 모든 포트 허용
const allowedOrigins = /^http:\/\/localhost:\d+$/;
```


## 현재 문제

현재 백엔드에서 403 Forbidden 에러가 발생하고 있습니다:
- **에러 발생 엔드포인트**: `/api/auth/login`, `/api/auth/profile`
- **응답 본문**: 비어있음 (content-length: 0)
- **원인 추정**: CORS 설정 또는 인증 미들웨어 문제

## 권장 CORS 설정 (Express.js 예시)

### 방법 1: 개발 환경에서 모든 Origin 허용 (가장 간단)
```javascript
const cors = require('cors');

// 개발 환경에서는 모든 Origin 허용
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  }));
} else {
  // 프로덕션에서는 특정 도메인만 허용
  app.use(cors({
    origin: ['https://your-production-domain.com'],
    credentials: true,
  }));
}
```

### 방법 2: localhost 정규식으로 허용
```javascript
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // React Native 앱의 경우 origin이 없을 수 있음
    if (!origin) {
      return callback(null, true);
    }
    
    // localhost의 모든 포트 허용
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:') ||
        process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
```

## 추가 확인 사항

1. **인증 미들웨어**: `/api/auth/login`과 `/api/auth/signup` 엔드포인트는 인증 미들웨어를 거치지 않아야 합니다.

2. **OPTIONS 요청**: CORS preflight 요청을 처리해야 합니다:
```javascript
app.options('*', cors(corsOptions));
```

3. **프로필 API**: `/api/auth/profile`은 인증이 필요한 엔드포인트이므로, 토큰이 유효한 경우에만 접근을 허용해야 합니다.

## 문의

프로덕션 배포 후 추가 주소를 알려드리겠습니다.
