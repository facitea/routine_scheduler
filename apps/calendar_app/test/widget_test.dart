import 'package:calendar_app/main.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('moves between months and adds an event', (tester) async {
    tester.view.physicalSize = const Size(1200, 820);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const CalendarApp());

    final now = DateTime.now();
    final currentMonth = '${now.year}.${now.month.toString().padLeft(2, '0')}';
    final nextMonthDate = DateTime.utc(now.year, now.month + 1, 1);
    final nextMonth =
        '${nextMonthDate.year}.${nextMonthDate.month.toString().padLeft(2, '0')}';
    final nextMonthLastDay = DateTime.utc(
      nextMonthDate.year,
      nextMonthDate.month + 1,
      0,
    ).day;
    final selectedDay = now.day > nextMonthLastDay ? nextMonthLastDay : now.day;
    final selectedDateTooltip =
        '${nextMonthDate.year.toString().padLeft(4, '0')}-'
        '${nextMonthDate.month.toString().padLeft(2, '0')}-'
        '${selectedDay.toString().padLeft(2, '0')}';

    await _pumpUntilFound(tester, find.text(currentMonth));

    expect(find.text('Routine Scheduler'), findsOneWidget);
    expect(find.text(currentMonth), findsOneWidget);

    await tester.tap(find.byTooltip('다음 달'));
    await tester.pumpAndSettle();

    expect(find.text(nextMonth), findsOneWidget);

    await tester.tap(find.byTooltip(selectedDateTooltip));
    await tester.pumpAndSettle();

    await tester.tap(find.text('일정 추가'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(EditableText), '보험료 납부');
    await tester.tap(find.text('저장'));
    await tester.pumpAndSettle();

    expect(find.text('보험료 납부'), findsAtLeastNWidgets(1));
  });

  testWidgets('opens settings and renders in a compact viewport', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(360, 420);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const CalendarApp());
    await _pumpUntilFound(tester, find.text('Routine Scheduler'));

    await tester.tap(find.byTooltip('설정'));
    await tester.pumpAndSettle();

    expect(find.text('다크 모드'), findsOneWidget);
    expect(find.text('글씨 크기'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

Future<void> _pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  int attempts = 30,
}) async {
  for (var attempt = 0; attempt < attempts; attempt++) {
    await tester.pump(const Duration(milliseconds: 100));
    if (finder.evaluate().isNotEmpty) {
      return;
    }
  }
  expect(finder, findsOneWidget);
}
