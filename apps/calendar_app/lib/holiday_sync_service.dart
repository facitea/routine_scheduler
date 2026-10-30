import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:recurrence_engine/recurrence_engine.dart';

import 'korean_holiday_calendar.dart';

class KoreanHolidaySyncService {
  KoreanHolidaySyncService({http.Client? client})
    : _client = client ?? http.Client();

  static const _countryCode = 'KR';
  static const _timeout = Duration(seconds: 10);

  final http.Client _client;

  Future<List<HolidayInfo>> fetchYear(int year) async {
    final uri = Uri.https(
      'date.nager.at',
      '/api/v3/PublicHolidays/$year/$_countryCode',
    );
    final response = await _client.get(uri).timeout(_timeout);
    if (response.statusCode != 200) {
      throw HolidaySyncException(
        'Holiday API returned ${response.statusCode}.',
      );
    }

    final decoded = jsonDecode(utf8.decode(response.bodyBytes));
    if (decoded is! List) {
      throw const HolidaySyncException('Holiday API returned invalid JSON.');
    }

    final holidays = <DateOnly, HolidayInfo>{};
    for (final item in decoded) {
      if (item is! Map<String, dynamic>) {
        continue;
      }

      final dateValue = item['date'];
      if (dateValue is! String) {
        continue;
      }

      final date = _dateFromIso(dateValue);
      final localName = (item['localName'] as String?)?.trim();
      final englishName = (item['name'] as String?)?.trim();
      final rawName = localName?.isNotEmpty == true
          ? localName!
          : englishName ?? '공휴일';
      final normalizedName = _normalizeHolidayName(rawName);
      final isSubstitute = _isLikelySubstitute(
        normalizedName: normalizedName,
        englishName: englishName ?? '',
        date: date,
      );

      holidays[date] = HolidayInfo(
        date: date,
        name: isSubstitute ? '대체공휴일($normalizedName)' : normalizedName,
        isSubstitute: isSubstitute,
      );
    }

    return holidays.values.toList()..sort((a, b) => a.date.compareTo(b.date));
  }

  void close() {
    _client.close();
  }

  DateOnly _dateFromIso(String value) {
    final parts = value.split('-').map(int.parse).toList(growable: false);
    if (parts.length != 3) {
      throw FormatException('Expected yyyy-MM-dd.', value);
    }
    return DateOnly(parts[0], parts[1], parts[2]);
  }

  String _normalizeHolidayName(String value) {
    return switch (value) {
      '3·1절' => '삼일절',
      '노동절' => '근로자의 날',
      '부처님 오신 날' => '부처님오신날',
      '지방 선거일' => '지방선거일',
      '크리스마스' => '성탄절',
      _ => value,
    };
  }

  bool _isLikelySubstitute({
    required String normalizedName,
    required String englishName,
    required DateOnly date,
  }) {
    if (normalizedName.contains('대체') ||
        englishName.toLowerCase().contains('substitute')) {
      return true;
    }

    final expectedDate = _fixedHolidayDates[normalizedName];
    return expectedDate != null &&
        (date.month != expectedDate.month || date.day != expectedDate.day);
  }

  static const _fixedHolidayDates = {
    '새해': _MonthDay(1, 1),
    '삼일절': _MonthDay(3, 1),
    '어린이날': _MonthDay(5, 5),
    '현충일': _MonthDay(6, 6),
    '제헌절': _MonthDay(7, 17),
    '광복절': _MonthDay(8, 15),
    '개천절': _MonthDay(10, 3),
    '한글날': _MonthDay(10, 9),
    '성탄절': _MonthDay(12, 25),
  };
}

class HolidaySyncException implements Exception {
  const HolidaySyncException(this.message);

  final String message;

  @override
  String toString() => 'HolidaySyncException: $message';
}

class _MonthDay {
  const _MonthDay(this.month, this.day);

  final int month;
  final int day;
}
