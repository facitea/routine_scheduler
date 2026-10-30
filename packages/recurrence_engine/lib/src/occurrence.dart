import 'date_only.dart';

class Occurrence {
  const Occurrence({
    required this.originalDate,
    required this.date,
    required this.wasAdjusted,
    required this.originalWasNonBusinessDay,
  });

  final DateOnly originalDate;
  final DateOnly date;
  final bool wasAdjusted;
  final bool originalWasNonBusinessDay;
}
