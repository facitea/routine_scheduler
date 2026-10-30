import 'package:recurrence_engine/recurrence_engine.dart';
import 'package:test/test.dart';

void main() {
  group('recurrence patterns', () {
    test('generates the first weekday of each month', () {
      final pattern = MonthlyByWeekdaysSetPosition(
        weekdays: const {
          DateTime.monday,
          DateTime.tuesday,
          DateTime.wednesday,
          DateTime.thursday,
          DateTime.friday,
        },
        setPosition: 1,
      );

      final dates = pattern
          .generate(
            from: DateOnly(2026, 1, 1),
            to: DateOnly(2026, 3, 31),
          )
          .toList();

      expect(dates, [
        DateOnly(2026, 1, 1),
        DateOnly(2026, 2, 2),
        DateOnly(2026, 3, 2),
      ]);
      expect(
        pattern.toRRule(),
        'RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=1',
      );
    });

    test('generates the last weekday of each month', () {
      final pattern = MonthlyByWeekdaysSetPosition(
        weekdays: const {
          DateTime.monday,
          DateTime.tuesday,
          DateTime.wednesday,
          DateTime.thursday,
          DateTime.friday,
        },
        setPosition: -1,
      );

      final dates = pattern
          .generate(
            from: DateOnly(2026, 1, 1),
            to: DateOnly(2026, 3, 31),
          )
          .toList();

      expect(dates, [
        DateOnly(2026, 1, 30),
        DateOnly(2026, 2, 27),
        DateOnly(2026, 3, 31),
      ]);
    });

    test('generates the second Tuesday of the month', () {
      final pattern = MonthlyNthWeekday(
        nth: 2,
        weekday: DateTime.tuesday,
      );

      final dates = pattern
          .generate(
            from: DateOnly(2026, 5, 1),
            to: DateOnly(2026, 5, 31),
          )
          .toList();

      expect(dates, [DateOnly(2026, 5, 12)]);
      expect(pattern.toRRule(), 'RRULE:FREQ=MONTHLY;BYDAY=2TU');
    });

    test('skips invalid monthly dates', () {
      final pattern = MonthlyByMonthDay(day: 31);

      final dates = pattern
          .generate(
            from: DateOnly(2026, 1, 1),
            to: DateOnly(2026, 3, 31),
          )
          .toList();

      expect(dates, [
        DateOnly(2026, 1, 31),
        DateOnly(2026, 3, 31),
      ]);
    });

    test('skips invalid yearly dates', () {
      final pattern = YearlyByMonthDay(month: 2, day: 29);

      final dates = pattern
          .generate(
            from: DateOnly(2024, 1, 1),
            to: DateOnly(2028, 12, 31),
          )
          .toList();

      expect(dates, [
        DateOnly(2024, 2, 29),
        DateOnly(2028, 2, 29),
      ]);
    });
  });

  group('holiday adjustment', () {
    test('moves a holiday to the next business day', () {
      final calendar = BusinessCalendar(
        holidayCalendar: InMemoryHolidayCalendar([
          DateOnly(2026, 1, 1),
        ]),
      );

      final occurrences = const OccurrenceGenerator().generate(
        pattern: MonthlyByWeekdaysSetPosition(
          weekdays: const {
            DateTime.monday,
            DateTime.tuesday,
            DateTime.wednesday,
            DateTime.thursday,
            DateTime.friday,
          },
          setPosition: 1,
        ),
        from: DateOnly(2026, 1, 1),
        to: DateOnly(2026, 1, 31),
        businessCalendar: calendar,
        adjustmentPolicy: HolidayAdjustmentPolicy.nextBusinessDay,
      );

      expect(occurrences.single.originalDate, DateOnly(2026, 1, 1));
      expect(occurrences.single.date, DateOnly(2026, 1, 2));
      expect(occurrences.single.wasAdjusted, isTrue);
      expect(occurrences.single.originalWasNonBusinessDay, isTrue);
    });

    test('moves a holiday to the previous business day', () {
      final calendar = BusinessCalendar(
        holidayCalendar: InMemoryHolidayCalendar([
          DateOnly(2026, 7, 31),
        ]),
      );

      final occurrences = const OccurrenceGenerator().generate(
        pattern: MonthlyByWeekdaysSetPosition(
          weekdays: const {
            DateTime.monday,
            DateTime.tuesday,
            DateTime.wednesday,
            DateTime.thursday,
            DateTime.friday,
          },
          setPosition: -1,
        ),
        from: DateOnly(2026, 7, 1),
        to: DateOnly(2026, 7, 31),
        businessCalendar: calendar,
        adjustmentPolicy: HolidayAdjustmentPolicy.previousBusinessDay,
      );

      expect(occurrences.single.originalDate, DateOnly(2026, 7, 31));
      expect(occurrences.single.date, DateOnly(2026, 7, 30));
      expect(occurrences.single.wasAdjusted, isTrue);
    });

    test('skips non-business occurrences', () {
      final calendar = BusinessCalendar(
        holidayCalendar: InMemoryHolidayCalendar([
          DateOnly(2026, 1, 1),
        ]),
      );

      final occurrences = const OccurrenceGenerator().generate(
        pattern: MonthlyByWeekdaysSetPosition(
          weekdays: const {
            DateTime.monday,
            DateTime.tuesday,
            DateTime.wednesday,
            DateTime.thursday,
            DateTime.friday,
          },
          setPosition: 1,
        ),
        from: DateOnly(2026, 1, 1),
        to: DateOnly(2026, 1, 31),
        businessCalendar: calendar,
        adjustmentPolicy: HolidayAdjustmentPolicy.skip,
      );

      expect(occurrences, isEmpty);
    });
  });
}
