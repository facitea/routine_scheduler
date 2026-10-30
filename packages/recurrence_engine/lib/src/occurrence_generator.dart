import 'business_calendar.dart';
import 'date_only.dart';
import 'holiday_adjustment_policy.dart';
import 'occurrence.dart';
import 'recurrence_pattern.dart';

class OccurrenceGenerator {
  const OccurrenceGenerator();

  List<Occurrence> generate({
    required RecurrencePattern pattern,
    required DateOnly from,
    required DateOnly to,
    required BusinessCalendar businessCalendar,
    HolidayAdjustmentPolicy adjustmentPolicy = HolidayAdjustmentPolicy.none,
  }) {
    if (from.compareTo(to) > 0) {
      throw ArgumentError.value('$from > $to', 'range', 'Invalid date range.');
    }

    final occurrences = <Occurrence>[];

    for (final originalDate in pattern.generate(from: from, to: to)) {
      final adjustedDate = adjustmentPolicy.apply(
        originalDate,
        businessCalendar,
      );

      if (adjustedDate == null) {
        continue;
      }

      occurrences.add(
        Occurrence(
          originalDate: originalDate,
          date: adjustedDate,
          wasAdjusted: adjustedDate != originalDate,
          originalWasNonBusinessDay:
              !businessCalendar.isBusinessDay(originalDate),
        ),
      );
    }

    occurrences.sort((a, b) => a.date.compareTo(b.date));
    return occurrences;
  }
}
