import 'date_only.dart';

abstract interface class RecurrencePattern {
  Iterable<DateOnly> generate({
    required DateOnly from,
    required DateOnly to,
  });

  String toRRule();
}

class YearlyByMonthDay implements RecurrencePattern {
  YearlyByMonthDay({
    required this.month,
    required this.day,
  }) {
    if (month < 1 || month > 12) {
      throw ArgumentError.value(month, 'month', 'Expected 1 through 12.');
    }
    if (day < 1 || day > 31) {
      throw ArgumentError.value(day, 'day', 'Expected 1 through 31.');
    }
  }

  final int month;
  final int day;

  @override
  Iterable<DateOnly> generate({
    required DateOnly from,
    required DateOnly to,
  }) sync* {
    for (var year = from.year; year <= to.year; year++) {
      final date = DateOnly.tryCreate(year, month, day);
      if (date != null && _containsDate(from, to, date)) {
        yield date;
      }
    }
  }

  @override
  String toRRule() {
    return 'RRULE:FREQ=YEARLY;BYMONTH=$month;BYMONTHDAY=$day';
  }
}

class MonthlyByMonthDay implements RecurrencePattern {
  MonthlyByMonthDay({required this.day}) {
    if (day < 1 || day > 31) {
      throw ArgumentError.value(day, 'day', 'Expected 1 through 31.');
    }
  }

  final int day;

  @override
  Iterable<DateOnly> generate({
    required DateOnly from,
    required DateOnly to,
  }) sync* {
    for (final month in _monthsBetween(from, to)) {
      final date = DateOnly.tryCreate(month.year, month.month, day);
      if (date != null && _containsDate(from, to, date)) {
        yield date;
      }
    }
  }

  @override
  String toRRule() => 'RRULE:FREQ=MONTHLY;BYMONTHDAY=$day';
}

class MonthlyNthWeekday implements RecurrencePattern {
  MonthlyNthWeekday({
    required this.nth,
    required this.weekday,
  }) {
    _validateNth(nth);
    _validateWeekday(weekday);
  }

  final int nth;
  final int weekday;

  @override
  Iterable<DateOnly> generate({
    required DateOnly from,
    required DateOnly to,
  }) sync* {
    for (final month in _monthsBetween(from, to)) {
      final date = _nthWeekdayOfMonth(month.year, month.month, nth, weekday);
      if (date != null && _containsDate(from, to, date)) {
        yield date;
      }
    }
  }

  @override
  String toRRule() {
    return 'RRULE:FREQ=MONTHLY;BYDAY=$nth${_weekdayCode(weekday)}';
  }
}

class MonthlyByWeekdaysSetPosition implements RecurrencePattern {
  MonthlyByWeekdaysSetPosition({
    required Set<int> weekdays,
    required this.setPosition,
  }) : weekdays = Set<int>.unmodifiable(weekdays) {
    if (weekdays.isEmpty) {
      throw ArgumentError.value(weekdays, 'weekdays', 'Expected weekdays.');
    }
    for (final weekday in weekdays) {
      _validateWeekday(weekday);
    }
    if (setPosition == 0) {
      throw ArgumentError.value(
        setPosition,
        'setPosition',
        'Expected a non-zero position.',
      );
    }
  }

  final Set<int> weekdays;
  final int setPosition;

  @override
  Iterable<DateOnly> generate({
    required DateOnly from,
    required DateOnly to,
  }) sync* {
    for (final month in _monthsBetween(from, to)) {
      final date = _dateAtSetPosition(
        year: month.year,
        month: month.month,
        weekdays: weekdays,
        setPosition: setPosition,
      );

      if (date != null && _containsDate(from, to, date)) {
        yield date;
      }
    }
  }

  @override
  String toRRule() {
    final weekdayList = weekdays.toList()..sort();
    final byDay = weekdayList.map(_weekdayCode).join(',');
    return 'RRULE:FREQ=MONTHLY;BYDAY=$byDay;BYSETPOS=$setPosition';
  }
}

class _YearMonth {
  const _YearMonth(this.year, this.month);

  final int year;
  final int month;
}

Iterable<_YearMonth> _monthsBetween(DateOnly from, DateOnly to) sync* {
  var year = from.year;
  var month = from.month;

  while (year < to.year || (year == to.year && month <= to.month)) {
    yield _YearMonth(year, month);

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
}

DateOnly? _nthWeekdayOfMonth(
  int year,
  int month,
  int nth,
  int weekday,
) {
  final daysInMonth = DateOnly.daysInMonth(year, month);

  if (nth > 0) {
    final first = DateOnly(year, month, 1);
    final delta = (weekday - first.weekday + 7) % 7;
    final day = 1 + delta + (7 * (nth - 1));
    return day <= daysInMonth ? DateOnly(year, month, day) : null;
  }

  final last = DateOnly(year, month, daysInMonth);
  final delta = (last.weekday - weekday + 7) % 7;
  final day = daysInMonth - delta + (7 * (nth + 1));
  return day >= 1 ? DateOnly(year, month, day) : null;
}

DateOnly? _dateAtSetPosition({
  required int year,
  required int month,
  required Set<int> weekdays,
  required int setPosition,
}) {
  final dates = <DateOnly>[];
  final daysInMonth = DateOnly.daysInMonth(year, month);

  for (var day = 1; day <= daysInMonth; day++) {
    final date = DateOnly(year, month, day);
    if (weekdays.contains(date.weekday)) {
      dates.add(date);
    }
  }

  final index = setPosition > 0 ? setPosition - 1 : dates.length + setPosition;
  if (index < 0 || index >= dates.length) {
    return null;
  }

  return dates[index];
}

bool _containsDate(DateOnly from, DateOnly to, DateOnly date) {
  return date.compareTo(from) >= 0 && date.compareTo(to) <= 0;
}

void _validateNth(int nth) {
  if (nth == 0 || nth < -5 || nth > 5) {
    throw ArgumentError.value(
      nth,
      'nth',
      'Expected -5 through -1 or 1 through 5.',
    );
  }
}

void _validateWeekday(int weekday) {
  if (weekday < DateTime.monday || weekday > DateTime.sunday) {
    throw ArgumentError.value(weekday, 'weekday', 'Expected 1 through 7.');
  }
}

String _weekdayCode(int weekday) {
  return switch (weekday) {
    DateTime.monday => 'MO',
    DateTime.tuesday => 'TU',
    DateTime.wednesday => 'WE',
    DateTime.thursday => 'TH',
    DateTime.friday => 'FR',
    DateTime.saturday => 'SA',
    DateTime.sunday => 'SU',
    _ => throw ArgumentError.value(weekday, 'weekday', 'Expected 1 through 7.'),
  };
}
