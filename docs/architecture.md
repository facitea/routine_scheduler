# 제품/아키텍처 초안

## 제품 목표

반복 작업을 정확하고 편하게 관리하는 캘린더입니다. 기존 캘린더가 잘 처리하지 못하는 업무형 반복 조건을 UI에서 쉽게 만들고, 내부적으로는 표준에 가까운 규칙으로 저장해 장기적으로 내보내기/동기화 가능성을 열어둡니다.

## 권장 스택

### 1순위: Flutter

- 장점: Windows, Android, iOS를 한 코드베이스로 개발 가능
- 장점: 캘린더 UI를 직접 커스터마이징하기 좋음
- 주의: iOS 빌드/배포는 macOS/Xcode 환경이 필요
- 주의: 모바일 홈 화면 위젯은 네이티브 코드와 연동해야 함

### 대안

- React Native + Windows: 모바일 중심이면 좋지만 Windows까지 안정적으로 가져가려면 구성이 복잡해질 수 있음
- .NET MAUI: Windows 친화적이지만 모바일 UI/위젯 생태계는 요구사항에 따라 검증 필요
- Qt: 데스크톱은 강하지만 모바일 앱/스토어/위젯까지 가면 개발 난도가 올라감

## 모듈 구조

```text
apps/
  calendar_app/          # Flutter 앱
packages/
  recurrence_engine/     # 반복 규칙 계산, 휴일 보정, 테스트
  holiday_provider/      # 국가별 공휴일 수집/캐시
docs/
  architecture.md
  recurrence-rules.md
  roadmap.md
```

## 핵심 도메인 모델

```text
Calendar
Event
RecurrenceRule
HolidayAdjustmentPolicy
HolidayCalendar
Occurrence
ExceptionDate
```

### Event

- id
- title
- startDateTime
- endDateTime
- timezone
- recurrenceRule
- holidayAdjustmentPolicy
- exceptionDates
- tags
- reminders

### RecurrenceRule

가능하면 RFC 5545 `RRULE` 문자열을 그대로 저장합니다.

예:

```text
RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1
```

앱 전용 확장은 별도 JSON에 저장합니다.

```json
{
  "rrule": "RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1",
  "holidayAdjustment": {
    "country": "KR",
    "mode": "next_business_day"
  }
}
```

## 공휴일 처리

공휴일은 반복 규칙 계산에 직접 섞지 않고, 발생일이 나온 뒤 보정합니다.

1. RRULE로 후보 날짜 생성
2. 국가/지역별 휴일 목록 조회
3. 주말/공휴일/대체공휴일 여부 확인
4. 정책에 따라 날짜 이동, 유지, 건너뛰기
5. 예외 일정과 충돌 처리

공휴일 provider는 교체 가능해야 합니다.

- 기본 provider: Nager.Date 같은 국가별 공휴일 API
- 한국 특화 provider: 공공데이터/직접 관리 JSON 추가 가능
- 사용자 override: 회사 휴무일, 임시 휴일, 개인 휴일

참고:

- RFC 5545 RRULE: https://www.rfc-editor.org/rfc/rfc5545
- Nager.Date API: https://date.nager.at/api

## Windows 자동 실행

설정 화면에 `Windows 시작 시 자동 실행` 토글을 둡니다.

구현 방식은 배포 방식에 따라 갈립니다.

- MSIX 패키징: `desktop:StartupTask` manifest extension
- 일반 설치 프로그램: Startup folder 또는 Run registry 등록

사용자가 Windows 작업 관리자 시작프로그램 탭에서 끌 수 있어야 하므로, 앱 내부 토글과 OS 상태가 어긋날 수 있다는 점을 UI에서 처리합니다.

## 모바일 위젯

앱 내부는 Flutter로 만들고, 홈 화면 위젯은 플랫폼별 네이티브 위젯으로 만듭니다.

- Android: AppWidget
- iOS: WidgetKit
- Flutter 앱과 위젯 사이에는 shared storage/deep link 사용
- 위젯에는 오늘 일정, 다음 반복 작업, 빠른 완료 버튼을 우선 제공

