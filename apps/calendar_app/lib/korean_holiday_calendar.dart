import 'package:recurrence_engine/recurrence_engine.dart';

class HolidayInfo {
  const HolidayInfo({
    required this.date,
    required this.name,
    this.isSubstitute = false,
  });

  final DateOnly date;
  final String name;
  final bool isSubstitute;
}

class KoreanHolidayProvider {
  KoreanHolidayProvider() {
    merge(_builtInHolidays);
  }

  final Map<DateOnly, HolidayInfo> _holidaysByDate = {};

  HolidayInfo? holidayOn(DateOnly date) => _holidaysByDate[date];

  Iterable<DateOnly> get dates => _holidaysByDate.keys;

  Iterable<HolidayInfo> holidaysForYear(int year) sync* {
    for (final holiday in _holidaysByDate.values) {
      if (holiday.date.year == year) {
        yield holiday;
      }
    }
  }

  Iterable<HolidayInfo> builtInHolidaysForYear(int year) {
    return _builtInHolidays.where((holiday) => holiday.date.year == year);
  }

  void merge(Iterable<HolidayInfo> holidays) {
    for (final holiday in holidays) {
      _holidaysByDate[holiday.date] = holiday;
    }
  }

  void replaceYear(int year, Iterable<HolidayInfo> holidays) {
    _holidaysByDate.removeWhere((date, _) => date.year == year);
    merge(holidays);
  }

  static final _builtInHolidays = [
    HolidayInfo(date: DateOnly(2026, 1, 1), name: '새해'),
    HolidayInfo(date: DateOnly(2026, 2, 16), name: '설날 연휴'),
    HolidayInfo(date: DateOnly(2026, 2, 17), name: '설날'),
    HolidayInfo(date: DateOnly(2026, 2, 18), name: '설날 연휴'),
    HolidayInfo(date: DateOnly(2026, 3, 1), name: '삼일절'),
    HolidayInfo(date: DateOnly(2026, 3, 2), name: '대체공휴일', isSubstitute: true),
    HolidayInfo(date: DateOnly(2026, 5, 1), name: '근로자의 날'),
    HolidayInfo(date: DateOnly(2026, 5, 5), name: '어린이날'),
    HolidayInfo(date: DateOnly(2026, 5, 24), name: '부처님오신날'),
    HolidayInfo(date: DateOnly(2026, 5, 25), name: '대체공휴일', isSubstitute: true),
    HolidayInfo(date: DateOnly(2026, 6, 3), name: '전국동시지방선거'),
    HolidayInfo(date: DateOnly(2026, 6, 6), name: '현충일'),
    HolidayInfo(date: DateOnly(2026, 7, 17), name: '제헌절'),
    HolidayInfo(date: DateOnly(2026, 8, 15), name: '광복절'),
    HolidayInfo(date: DateOnly(2026, 8, 17), name: '대체공휴일', isSubstitute: true),
    HolidayInfo(date: DateOnly(2026, 9, 24), name: '추석 연휴'),
    HolidayInfo(date: DateOnly(2026, 9, 25), name: '추석'),
    HolidayInfo(date: DateOnly(2026, 9, 26), name: '추석 연휴'),
    HolidayInfo(date: DateOnly(2026, 10, 3), name: '개천절'),
    HolidayInfo(date: DateOnly(2026, 10, 5), name: '대체공휴일', isSubstitute: true),
    HolidayInfo(date: DateOnly(2026, 10, 9), name: '한글날'),
    HolidayInfo(date: DateOnly(2026, 12, 25), name: '성탄절'),
  ];
}

class KoreanHolidayCalendar implements HolidayCalendar {
  KoreanHolidayCalendar(this.provider);

  final KoreanHolidayProvider provider;

  @override
  bool isHoliday(DateOnly date) => provider.holidayOn(date) != null;
}
