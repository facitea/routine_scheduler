import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlite3/sqlite3.dart';

class StoredEvent {
  const StoredEvent({
    required this.id,
    required this.title,
    required this.startDate,
    required this.priority,
    required this.recurrenceKind,
    required this.adjustmentMode,
    required this.completedDates,
  });

  final String id;
  final String title;
  final String startDate;
  final int priority;
  final String recurrenceKind;
  final String adjustmentMode;
  final Set<String> completedDates;
}

class StoredAppSettings {
  const StoredAppSettings({
    required this.isDarkMode,
    required this.fontScale,
    required this.autoSyncEnabled,
  });

  final bool isDarkMode;
  final double fontScale;
  final bool autoSyncEnabled;
}

class StoredHoliday {
  const StoredHoliday({
    required this.date,
    required this.name,
    required this.isSubstitute,
  });

  final String date;
  final String name;
  final bool isSubstitute;
}

class LocalCalendarDatabase {
  LocalCalendarDatabase._(this._db);

  final Database _db;

  static Future<LocalCalendarDatabase> open() async {
    final supportDir = await getApplicationSupportDirectory();
    await supportDir.create(recursive: true);
    final dbPath = p.join(supportDir.path, 'advanced_calendar.sqlite');
    final db = sqlite3.open(dbPath);
    final database = LocalCalendarDatabase._(db);
    database._migrate();
    return database;
  }

  void close() {
    _db.close();
  }

  List<StoredEvent> loadEvents() {
    final rows = _db.select('''
      SELECT id, title, start_date, priority, recurrence_kind, adjustment_mode
      FROM events
      WHERE deleted_at IS NULL
      ORDER BY start_date, priority DESC, title
      ''');
    final completedDatesByEvent = _loadCompletedDates();

    return [
      for (final row in rows)
        StoredEvent(
          id: row['id'] as String,
          title: row['title'] as String,
          startDate: row['start_date'] as String,
          priority: row['priority'] as int,
          recurrenceKind: row['recurrence_kind'] as String,
          adjustmentMode: row['adjustment_mode'] as String,
          completedDates:
              completedDatesByEvent[row['id'] as String] ?? <String>{},
        ),
    ];
  }

  Map<String, int> loadDateMarks() {
    final rows = _db.select('''
      SELECT date, color_value
      FROM date_marks
      WHERE deleted_at IS NULL
      ''');

    return {
      for (final row in rows) row['date'] as String: row['color_value'] as int,
    };
  }

  StoredAppSettings loadSettings() {
    final rows = _db.select('''
      SELECT key, value
      FROM app_settings
      ''');
    final settings = {
      for (final row in rows) row['key'] as String: row['value'] as String,
    };

    return StoredAppSettings(
      isDarkMode: settings['is_dark_mode'] == 'true',
      fontScale: double.tryParse(settings['font_scale'] ?? '') ?? 1.0,
      autoSyncEnabled: settings['auto_sync_enabled'] == 'true',
    );
  }

  void saveSettings({
    bool? isDarkMode,
    double? fontScale,
    bool? autoSyncEnabled,
  }) {
    if (isDarkMode != null) {
      _saveSetting('is_dark_mode', isDarkMode.toString());
    }
    if (fontScale != null) {
      _saveSetting('font_scale', fontScale.toStringAsFixed(2));
    }
    if (autoSyncEnabled != null) {
      _saveSetting('auto_sync_enabled', autoSyncEnabled.toString());
    }
  }

  List<StoredHoliday> loadHolidays(int year) {
    final rows = _db.select(
      '''
      SELECT date, name, is_substitute
      FROM holidays
      WHERE year = ?
      ORDER BY date
      ''',
      [year],
    );

    return [
      for (final row in rows)
        StoredHoliday(
          date: row['date'] as String,
          name: row['name'] as String,
          isSubstitute: (row['is_substitute'] as int) == 1,
        ),
    ];
  }

  DateTime? holidayLastUpdatedAt(int year) {
    final rows = _db.select(
      '''
      SELECT updated_at
      FROM holiday_sync_state
      WHERE year = ?
      ''',
      [year],
    );
    if (rows.isEmpty) {
      return null;
    }
    return DateTime.tryParse(rows.first['updated_at'] as String);
  }

  void replaceHolidays({
    required int year,
    required Iterable<StoredHoliday> holidays,
  }) {
    final now = DateTime.now().toUtc().toIso8601String();
    _db.execute('DELETE FROM holidays WHERE year = ?', [year]);
    for (final holiday in holidays) {
      _db.execute(
        '''
        INSERT INTO holidays (year, date, name, is_substitute)
        VALUES (?, ?, ?, ?)
        ''',
        [year, holiday.date, holiday.name, holiday.isSubstitute ? 1 : 0],
      );
    }
    _db.execute(
      '''
      INSERT INTO holiday_sync_state (year, updated_at)
      VALUES (?, ?)
      ON CONFLICT(year) DO UPDATE SET updated_at = excluded.updated_at
      ''',
      [year, now],
    );
  }

  void saveEvent({
    required String id,
    required String title,
    required String startDate,
    required int priority,
    required String recurrenceKind,
    required String adjustmentMode,
  }) {
    final now = DateTime.now().toUtc().toIso8601String();
    _db.execute(
      '''
      INSERT INTO events (
        id, title, start_date, priority, recurrence_kind, adjustment_mode,
        updated_at, deleted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        start_date = excluded.start_date,
        priority = excluded.priority,
        recurrence_kind = excluded.recurrence_kind,
        adjustment_mode = excluded.adjustment_mode,
        updated_at = excluded.updated_at,
        deleted_at = NULL
      ''',
      [id, title, startDate, priority, recurrenceKind, adjustmentMode, now],
    );
  }

  void deleteEvent(String id) {
    final now = DateTime.now().toUtc().toIso8601String();
    _db.execute(
      '''
      UPDATE events
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
      ''',
      [now, now, id],
    );
  }

  void replaceCalendarData({
    required Iterable<StoredEvent> events,
    required Map<String, int> dateMarks,
  }) {
    _db.execute('BEGIN IMMEDIATE');
    try {
      _db.execute('DELETE FROM completed_occurrences');
      _db.execute('DELETE FROM events');
      _db.execute('DELETE FROM date_marks');

      for (final event in events) {
        saveEvent(
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          priority: event.priority,
          recurrenceKind: event.recurrenceKind,
          adjustmentMode: event.adjustmentMode,
        );
        for (final completedDate in event.completedDates) {
          setOccurrenceCompleted(
            eventId: event.id,
            date: completedDate,
            isCompleted: true,
          );
        }
      }

      for (final entry in dateMarks.entries) {
        setDateMark(date: entry.key, colorValue: entry.value);
      }

      _db.execute('COMMIT');
    } catch (_) {
      _db.execute('ROLLBACK');
      rethrow;
    }
  }

  void setOccurrenceCompleted({
    required String eventId,
    required String date,
    required bool isCompleted,
  }) {
    if (isCompleted) {
      final now = DateTime.now().toUtc().toIso8601String();
      _db.execute(
        '''
        INSERT INTO completed_occurrences (event_id, date, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(event_id, date) DO UPDATE SET
          updated_at = excluded.updated_at
        ''',
        [eventId, date, now],
      );
    } else {
      _db.execute(
        '''
        DELETE FROM completed_occurrences
        WHERE event_id = ? AND date = ?
        ''',
        [eventId, date],
      );
    }
  }

  void setDateMark({required String date, required int colorValue}) {
    final now = DateTime.now().toUtc().toIso8601String();
    _db.execute(
      '''
      INSERT INTO date_marks (date, color_value, updated_at, deleted_at)
      VALUES (?, ?, ?, NULL)
      ON CONFLICT(date) DO UPDATE SET
        color_value = excluded.color_value,
        updated_at = excluded.updated_at,
        deleted_at = NULL
      ''',
      [date, colorValue, now],
    );
  }

  void clearDateMark(String date) {
    final now = DateTime.now().toUtc().toIso8601String();
    _db.execute(
      '''
      UPDATE date_marks
      SET deleted_at = ?, updated_at = ?
      WHERE date = ?
      ''',
      [now, now, date],
    );
  }

  void _saveSetting(String key, String value) {
    final now = DateTime.now().toUtc().toIso8601String();
    _db.execute(
      '''
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
      ''',
      [key, value, now],
    );
  }

  Map<String, Set<String>> _loadCompletedDates() {
    final rows = _db.select('''
      SELECT event_id, date
      FROM completed_occurrences
      ''');
    final result = <String, Set<String>>{};
    for (final row in rows) {
      result
          .putIfAbsent(row['event_id'] as String, () => <String>{})
          .add(row['date'] as String);
    }
    return result;
  }

  void _migrate() {
    _db.execute('PRAGMA foreign_keys = ON');
    _db.execute('''
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        priority INTEGER NOT NULL CHECK(priority BETWEEN 1 AND 3),
        recurrence_kind TEXT NOT NULL,
        adjustment_mode TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      )
      ''');
    _db.execute('''
      CREATE TABLE IF NOT EXISTS completed_occurrences (
        event_id TEXT NOT NULL,
        date TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (event_id, date),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
      ''');
    _db.execute('''
      CREATE TABLE IF NOT EXISTS date_marks (
        date TEXT PRIMARY KEY,
        color_value INTEGER NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      )
      ''');
    _db.execute('''
      CREATE INDEX IF NOT EXISTS idx_events_start_date
      ON events(start_date)
      ''');
    _db.execute('''
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
      ''');
    _db.execute('''
      CREATE TABLE IF NOT EXISTS holidays (
        year INTEGER NOT NULL,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        is_substitute INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (year, date)
      )
      ''');
    _db.execute('''
      CREATE TABLE IF NOT EXISTS holiday_sync_state (
        year INTEGER PRIMARY KEY,
        updated_at TEXT NOT NULL
      )
      ''');
  }
}
