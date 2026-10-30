# 로드맵

## 0단계: 개발 환경

- Flutter SDK 설치
- Android Studio 또는 Android SDK 설치
- iOS 빌드용 macOS/Xcode 환경 준비
- Windows 빌드용 Visual Studio Desktop development with C++ 워크로드 확인

## 1단계: 반복 엔진 MVP

- 기본 `RRULE` 문자열 생성
- 기간별 occurrence 계산
- `next_business_day`, `previous_business_day`, `skip` 보정
- 국가별 공휴일 캐시
- 단위 테스트: 월초/월말/연간/윤년/연휴

## 2단계: 캘린더 앱 MVP

- 월간/주간/일간 뷰
- 일정 생성/수정/삭제
- 고급 반복 편집 UI
- 반복 일정 미리보기
- 로컬 저장소

## 3단계: 플랫폼 기능

- Windows 로그인 자동 실행
- Android 홈 화면 위젯
- iOS WidgetKit 위젯
- 알림/reminder

## 4단계: 동기화와 내보내기

- iCalendar `.ics` export/import
- 클라우드 동기화 후보 검토
- 계정/백업/복원

## 첫 구현 제안

가장 먼저 `packages/recurrence_engine`을 독립 패키지로 만듭니다. UI보다 먼저 반복 계산을 검증해야 앱의 차별점이 선명해집니다.

초기 acceptance criteria:

- 매월 첫 평일을 12개월치 생성할 수 있다
- 매월 마지막 평일을 12개월치 생성할 수 있다
- 공휴일이면 다음 업무일로 이동할 수 있다
- 공휴일이면 이전 업무일로 이동할 수 있다
- 생성 결과를 UI에서 설명 가능한 문장으로 보여줄 수 있다
