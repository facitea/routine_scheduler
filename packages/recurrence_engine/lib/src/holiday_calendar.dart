import 'date_only.dart';

abstract interface class HolidayCalendar {
  bool isHoliday(DateOnly date);
}

class EmptyHolidayCalendar implements HolidayCalendar {
  const EmptyHolidayCalendar();

  @override
  bool isHoliday(DateOnly date) => false;
}

class InMemoryHolidayCalendar implements HolidayCalendar {
  InMemoryHolidayCalendar(Iterable<DateOnly> holidays)
      : _holidays = Set<DateOnly>.from(holidays);

  final Set<DateOnly> _holidays;

  @override
  bool isHoliday(DateOnly date) => _holidays.contains(date);
}
