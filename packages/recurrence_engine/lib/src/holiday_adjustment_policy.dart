import 'business_calendar.dart';
import 'date_only.dart';

enum HolidayAdjustmentMode {
  none,
  nextBusinessDay,
  previousBusinessDay,
  nearestBusinessDay,
  skip,
  keepAndMark,
}

class HolidayAdjustmentPolicy {
  const HolidayAdjustmentPolicy(this.mode);

  static const none = HolidayAdjustmentPolicy(HolidayAdjustmentMode.none);
  static const nextBusinessDay =
      HolidayAdjustmentPolicy(HolidayAdjustmentMode.nextBusinessDay);
  static const previousBusinessDay =
      HolidayAdjustmentPolicy(HolidayAdjustmentMode.previousBusinessDay);
  static const nearestBusinessDay =
      HolidayAdjustmentPolicy(HolidayAdjustmentMode.nearestBusinessDay);
  static const skip = HolidayAdjustmentPolicy(HolidayAdjustmentMode.skip);
  static const keepAndMark =
      HolidayAdjustmentPolicy(HolidayAdjustmentMode.keepAndMark);

  final HolidayAdjustmentMode mode;

  DateOnly? apply(DateOnly date, BusinessCalendar calendar) {
    return switch (mode) {
      HolidayAdjustmentMode.none => date,
      HolidayAdjustmentMode.keepAndMark => date,
      HolidayAdjustmentMode.nextBusinessDay =>
        _findNextBusinessDay(date, calendar),
      HolidayAdjustmentMode.previousBusinessDay =>
        _findPreviousBusinessDay(date, calendar),
      HolidayAdjustmentMode.nearestBusinessDay =>
        _findNearestBusinessDay(date, calendar),
      HolidayAdjustmentMode.skip => calendar.isBusinessDay(date) ? date : null,
    };
  }

  DateOnly _findNextBusinessDay(DateOnly date, BusinessCalendar calendar) {
    var cursor = date;
    while (!calendar.isBusinessDay(cursor)) {
      cursor = cursor.addDays(1);
    }
    return cursor;
  }

  DateOnly _findPreviousBusinessDay(DateOnly date, BusinessCalendar calendar) {
    var cursor = date;
    while (!calendar.isBusinessDay(cursor)) {
      cursor = cursor.addDays(-1);
    }
    return cursor;
  }

  DateOnly _findNearestBusinessDay(DateOnly date, BusinessCalendar calendar) {
    if (calendar.isBusinessDay(date)) {
      return date;
    }

    for (var offset = 1; offset <= 366; offset++) {
      final next = date.addDays(offset);
      if (calendar.isBusinessDay(next)) {
        return next;
      }

      final previous = date.addDays(-offset);
      if (calendar.isBusinessDay(previous)) {
        return previous;
      }
    }

    throw StateError('No business day found within 366 days of $date.');
  }
}
