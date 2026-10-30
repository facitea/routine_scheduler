# 반복 규칙 명세

## 원칙

반복 규칙은 두 층으로 나눕니다.

1. `RRULE`: 표준 iCalendar 반복 규칙으로 후보 날짜 생성
2. `Adjustment`: 주말/공휴일/업무일 조건에 따른 앱 전용 보정

이렇게 나누면 표준 캘린더와 호환 가능한 부분은 유지하면서, 업무용 디테일은 우리 앱이 더 잘 처리할 수 있습니다.

## 기본 반복 예시

| 사용자 표현 | 내부 RRULE |
| --- | --- |
| 매년 5월 1일 | `RRULE:FREQ=YEARLY;BYMONTH=5;BYMONTHDAY=1` |
| 매월 25일 | `RRULE:FREQ=MONTHLY;BYMONTHDAY=25` |
| 매주 월/수/금 | `RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR` |
| 매월 둘째 화요일 | `RRULE:FREQ=MONTHLY;BYDAY=2TU` |
| 매월 마지막 금요일 | `RRULE:FREQ=MONTHLY;BYDAY=-1FR` |
| 매월 첫 평일 | `RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1` |
| 매월 마지막 평일 | `RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1` |

## 휴일/업무일 보정 정책

RRULE 결과가 나온 뒤 다음 정책 중 하나를 적용합니다.

```text
none                  # 보정하지 않음
next_business_day     # 휴일/주말이면 다음 업무일
previous_business_day # 휴일/주말이면 이전 업무일
nearest_business_day  # 가까운 업무일, 동률이면 다음날
skip                  # 휴일/주말이면 해당 회차 생성하지 않음
keep_and_mark         # 날짜는 유지하고 휴일 표시만 붙임
```

업무일 판단:

```text
business day = weekday && !public holiday && !user holiday
```

## 예시: 매월 마지막 평일, 휴일이면 전 업무일

```json
{
  "title": "월말 정산",
  "startDateTime": "2026-01-30T09:00:00+09:00",
  "timezone": "Asia/Seoul",
  "rrule": "RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1",
  "holidayAdjustment": {
    "country": "KR",
    "mode": "previous_business_day"
  }
}
```

## 예시: 매월 첫 평일, 휴일이면 다음 업무일

```json
{
  "title": "월초 보고",
  "startDateTime": "2026-01-01T10:00:00+09:00",
  "timezone": "Asia/Seoul",
  "rrule": "RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1",
  "holidayAdjustment": {
    "country": "KR",
    "mode": "next_business_day"
  }
}
```

## 예시: 매년 특정일, 휴일이면 다음 업무일

```json
{
  "title": "연례 점검",
  "startDateTime": "2026-05-01T14:00:00+09:00",
  "timezone": "Asia/Seoul",
  "rrule": "RRULE:FREQ=YEARLY;BYMONTH=5;BYMONTHDAY=1",
  "holidayAdjustment": {
    "country": "KR",
    "mode": "next_business_day"
  }
}
```

## 예외 처리

반복 일정에는 개별 회차 예외가 필요합니다.

```json
{
  "exceptionDates": ["2026-05-04"],
  "movedOccurrences": [
    {
      "originalDate": "2026-06-01",
      "newDateTime": "2026-06-02T15:00:00+09:00"
    }
  ]
}
```

## 계산 순서

```text
1. 기준 기간 조회: 예) 2026-01-01 ~ 2026-12-31
2. RRULE로 후보 발생일 생성
3. 각 후보에 timezone 적용
4. holidayAdjustment 적용
5. exceptionDates 제거
6. movedOccurrences 반영
7. 같은 날짜로 이동한 회차가 있으면 충돌 정책 적용
```

## 테스트해야 할 경계값

- 2월 29일 연간 반복
- 매월 31일 반복
- 첫 평일이 공휴일인 달
- 마지막 평일이 공휴일인 달
- 연휴가 길어서 다음 업무일이 다음 달로 넘어가는 경우
- 이전 업무일이 이전 달/이전 해로 넘어가는 경우
- DST가 있는 timezone
- 사용자가 직접 추가한 회사 휴무일
- 공휴일 API가 실패했을 때 캐시 사용

