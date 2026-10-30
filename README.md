# Routine Scheduler & Office Toolbox

Windows, Android, iOS에서 동작하는 반복 일정 중심 캘린더 앱 초안입니다.

이 저장소에는 Flutter 루틴 스케줄러, 반복 일정 엔진 패키지, Firebase Hosting으로 배포하는 웹 오피스 도구가 함께 들어 있습니다.

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

### Flutter 캘린더 앱

필요한 도구: Flutter SDK와 대상 플랫폼 개발 도구

```powershell
cd routine_scheduler\apps\calendar_app
flutter pub get
flutter run
```

Firebase/Google 로그인 설정 파일과 OAuth 값은 보안상 저장소에 포함하지 않습니다. Android와 iOS 설정 파일 및 Windows `--dart-define` 값은 [Windows Google 로그인 설정](docs/windows_google_login.md)을 참고해 준비합니다.

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

이 프로젝트의 핵심은 일반적인 월/주/일 캘린더 화면보다 `정교한 반복 규칙 엔진`입니다. 매년 반복, 매달 반복, 매월 첫/마지막 평일, n번째 주 특정 요일, 공휴일이면 전날/다음날로 이동 같은 조건을 안정적으로 표현하고 계산하는 것을 1차 목표로 둡니다.

## 방향

- 앱 프레임워크: Flutter 우선 검토
- 플랫폼: Windows desktop, Android, iOS
- Windows: 로그인 시 자동 실행 옵션 제공
- 모바일: Android/iOS 홈 화면 위젯 제공
- 반복 엔진: iCalendar RFC 5545 RRULE 기반 + 앱 전용 휴일/업무일 보정 정책
- 공휴일: 국가별 공휴일 provider를 분리하고, 연도/국가 단위 캐시 사용

## 왜 Flutter 우선인가

Flutter는 Windows, Android, iOS를 한 코드베이스로 지원하고 데스크톱 앱 빌드도 가능합니다. 다만 모바일 홈 화면 위젯은 Flutter UI를 그대로 띄우는 방식이 아니라, Android AppWidget / iOS WidgetKit 쪽 네이티브 위젯과 데이터를 공유하는 구조로 잡아야 합니다.

참고:

- Flutter desktop: https://docs.flutter.dev/platform-integration/desktop
- Flutter supported platforms: https://docs.flutter.dev/reference/supported-platforms
- Flutter home_widget package: https://pub.dev/packages/home_widget
- Windows startup task: https://learn.microsoft.com/en-us/windows/apps/desktop/modernize/desktop-to-uwp-extensions

## 초기 문서

- [제품/아키텍처](docs/architecture.md)
- [반복 규칙 명세](docs/recurrence-rules.md)
- [로드맵](docs/roadmap.md)
- [개발 환경 설정](docs/setup.md)

## 현재 구현

- [Flutter 앱](apps/calendar_app/README.md)
- [반복 엔진 패키지](packages/recurrence_engine/README.md)
- [반복 엔진 테스트](packages/recurrence_engine/test/recurrence_engine_test.dart)
