# Office Toolbox Web

Firebase Hosting으로 배포하는 웹 기반 오피스 도구입니다.

## 다른 PC에서 시작하기

### 웹 오피스 도구

필요한 도구: Node.js 20 이상

```powershell
git clone https://github.com/facitea/routine_scheduler.git
cd routine_scheduler\apps\office_toolbox_web
npm ci
npm run dev
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다. 정적 빌드는 다음 명령으로 생성합니다.

```powershell
npm run build
npm run preview
```

동영상 도구에 필요한 FFmpeg JavaScript, Worker, WASM 자산은 `src/vendor`에 포함되어 있으므로 별도 FFmpeg 설치가 필요하지 않습니다.

반복 일정 엔진 테스트:

```powershell
cd routine_scheduler\packages\recurrence_engine
dart pub get
dart test
```

### Firebase Hosting 배포

Node.js가 설치되어 있으면 저장소 루트의 `firebase.cmd`가 Firebase CLI를 자동으로 실행합니다.

```powershell
cd routine_scheduler\apps\office_toolbox_web
npm ci
npm run build
cd ..\..
.\firebase.cmd login
.\firebase.cmd deploy --only hosting
```

Firebase 프로젝트 접근 권한은 별도로 필요합니다.

## 초기 문서

- [제품/아키텍처](docs/architecture.md)
- [반복 규칙 명세](docs/recurrence-rules.md)
- [로드맵](docs/roadmap.md)
- [개발 환경 설정](docs/setup.md)

## 현재 구현

- [오피스 툴박스 웹](apps/office_toolbox_web)
- [반복 엔진 패키지](packages/recurrence_engine/README.md)
- [반복 엔진 테스트](packages/recurrence_engine/test/recurrence_engine_test.dart)
