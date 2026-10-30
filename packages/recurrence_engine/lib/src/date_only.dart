class DateOnly implements Comparable<DateOnly> {
  DateOnly(this.year, this.month, this.day) {
    if (!isValid(year, month, day)) {
      throw ArgumentError.value('$year-$month-$day', 'date', 'Invalid date.');
    }
  }

  final int year;
  final int month;
  final int day;

  static DateOnly? tryCreate(int year, int month, int day) {
    if (!isValid(year, month, day)) {
      return null;
    }

    return DateOnly(year, month, day);
  }

  static bool isValid(int year, int month, int day) {
    return month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= daysInMonth(year, month);
  }

  static int daysInMonth(int year, int month) {
    return DateTime.utc(year, month + 1, 0).day;
  }

  int get weekday => DateTime.utc(year, month, day).weekday;

  DateTime toUtcDateTime() => DateTime.utc(year, month, day);

  DateOnly addDays(int days) {
    final date = toUtcDateTime().add(Duration(days: days));
    return DateOnly(date.year, date.month, date.day);
  }

  @override
  int compareTo(DateOnly other) {
    final yearCompare = year.compareTo(other.year);
    if (yearCompare != 0) {
      return yearCompare;
    }

    final monthCompare = month.compareTo(other.month);
    if (monthCompare != 0) {
      return monthCompare;
    }

    return day.compareTo(other.day);
  }

  String toIso8601String() {
    return '${year.toString().padLeft(4, '0')}-'
        '${month.toString().padLeft(2, '0')}-'
        '${day.toString().padLeft(2, '0')}';
  }

  @override
  String toString() => toIso8601String();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is DateOnly &&
            year == other.year &&
            month == other.month &&
            day == other.day;
  }

  @override
  int get hashCode => Object.hash(year, month, day);
}
