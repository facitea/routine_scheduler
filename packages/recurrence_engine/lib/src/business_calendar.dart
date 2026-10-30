import 'date_only.dart';
import 'holiday_calendar.dart';

class BusinessCalendar {
  BusinessCalendar({
    HolidayCalendar holidayCalendar = const EmptyHolidayCalendar(),
    Set<int> weekendWeekdays = const {DateTime.saturday, DateTime.sunday},
  })  : _holidayCalendar = holidayCalendar,
        _weekendWeekdays = Set<int>.from(weekendWeekdays) {
    for (final weekday in _weekendWeekdays) {
      _validateWeekday(weekday);
    }
  }

  final HolidayCalendar _holidayCalendar;
  final Set<int> _weekendWeekdays;

  bool isWeekend(DateOnly date) => _weekendWeekdays.contains(date.weekday);

  bool isHoliday(DateOnly date) => _holidayCalendar.isHoliday(date);

  bool isBusinessDay(DateOnly date) {
    return !isWeekend(date) && !isHoliday(date);
  }
}

void _validateWeekday(int weekday) {
  if (weekday < DateTime.monday || weekday > DateTime.sunday) {
    throw ArgumentError.value(weekday, 'weekday', 'Expected 1 through 7.');
  }
}
