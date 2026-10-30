import 'dart:async';
import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:recurrence_engine/recurrence_engine.dart';

import 'cloud_sync_service.dart';
import 'firebase_options.dart';
import 'holiday_sync_service.dart';
import 'korean_holiday_calendar.dart';
import 'local_calendar_database.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  var firebaseEnabled = false;

  if (Platform.environment['FLUTTER_TEST'] != 'true') {
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      firebaseEnabled = true;
    } catch (_) {
      firebaseEnabled = false;
    }
  }

  runApp(CalendarApp(firebaseEnabled: firebaseEnabled));
}

class CalendarApp extends StatefulWidget {
  const CalendarApp({super.key, this.firebaseEnabled = false});

  final bool firebaseEnabled;

  @override
  State<CalendarApp> createState() => _CalendarAppState();
}

class _CalendarAppState extends State<CalendarApp> {
  bool _isDarkMode = false;
  double _fontScale = 1.0;

  void _applySettings({required bool isDarkMode, required double fontScale}) {
    final normalizedFontScale = _normalizeFontScale(fontScale);
    if (_isDarkMode == isDarkMode && _fontScale == normalizedFontScale) {
      return;
    }

    setState(() {
      _isDarkMode = isDarkMode;
      _fontScale = normalizedFontScale;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Routine Scheduler',
      debugShowCheckedModeBanner: false,
      theme: _buildAppTheme(Brightness.light),
      darkTheme: _buildAppTheme(Brightness.dark),
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light,
      builder: (context, child) {
        final mediaQuery = MediaQuery.of(context);
        return MediaQuery(
          data: mediaQuery.copyWith(textScaler: TextScaler.linear(_fontScale)),
          child: child ?? const SizedBox.shrink(),
        );
      },
      home: CalendarHomePage(
        firebaseEnabled: widget.firebaseEnabled,
        isDarkMode: _isDarkMode,
        fontScale: _fontScale,
        onSettingsChanged: _applySettings,
      ),
    );
  }
}

typedef SettingsChanged =
    void Function({required bool isDarkMode, required double fontScale});

ThemeData _buildAppTheme(Brightness brightness) {
  final isDark = brightness == Brightness.dark;
  final colorScheme = ColorScheme.fromSeed(
    seedColor: const Color(0xFF087F8C),
    brightness: brightness,
  );

  return ThemeData(
    colorScheme: colorScheme,
    scaffoldBackgroundColor: isDark
        ? const Color(0xFF0B1220)
        : const Color(0xFFF6F7F9),
    appBarTheme: AppBarTheme(
      centerTitle: false,
      backgroundColor: isDark ? const Color(0xFF111827) : Colors.white,
      foregroundColor: isDark
          ? const Color(0xFFE5E7EB)
          : const Color(0xFF172026),
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: isDark ? const Color(0xFF111827) : Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(8)),
        side: BorderSide(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: isDark ? const Color(0xFF111827) : Colors.white,
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      isDense: true,
    ),
    dividerTheme: DividerThemeData(
      color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
    ),
    useMaterial3: true,
  );
}

double _normalizeFontScale(double value) {
  return value.clamp(0.85, 1.25).toDouble();
}

enum RecurrenceKind {
  none,
  daily,
  monthlyByDay,
  yearlyByMonthDay,
  monthlyNthWeekday,
  monthlyFirstWeekday,
  monthlyLastWeekday,
}

extension RecurrenceKindLabel on RecurrenceKind {
  String get label {
    return switch (this) {
      RecurrenceKind.none => '반복 없음',
      RecurrenceKind.daily => '매일',
      RecurrenceKind.monthlyByDay => '매월 같은 날짜',
      RecurrenceKind.yearlyByMonthDay => '매년 같은 날짜',
      RecurrenceKind.monthlyNthWeekday => '매월 n번째 요일',
      RecurrenceKind.monthlyFirstWeekday => '매월 첫 평일',
      RecurrenceKind.monthlyLastWeekday => '매월 마지막 평일',
    };
  }
}

extension HolidayAdjustmentModeLabel on HolidayAdjustmentMode {
  String get label {
    return switch (this) {
      HolidayAdjustmentMode.none => '보정 없음',
      HolidayAdjustmentMode.nextBusinessDay => '휴일이면 다음 업무일',
      HolidayAdjustmentMode.previousBusinessDay => '휴일이면 이전 업무일',
      HolidayAdjustmentMode.nearestBusinessDay => '가까운 업무일',
      HolidayAdjustmentMode.skip => '휴일이면 건너뛰기',
      HolidayAdjustmentMode.keepAndMark => '휴일 표시만',
    };
  }

  HolidayAdjustmentPolicy get policy => HolidayAdjustmentPolicy(this);
}

class CalendarEvent {
  CalendarEvent({
    required this.id,
    required this.title,
    required this.startDate,
    required this.priority,
    required this.recurrenceKind,
    required this.adjustmentMode,
    Set<DateOnly>? completedDates,
  }) : assert(priority >= 1 && priority <= 3),
       completedDates = completedDates ?? <DateOnly>{};

  final String id;
  final String title;
  final DateOnly startDate;
  final int priority;
  final RecurrenceKind recurrenceKind;
  final HolidayAdjustmentMode adjustmentMode;
  final Set<DateOnly> completedDates;

  CalendarEvent copyWith({
    String? title,
    DateOnly? startDate,
    int? priority,
    RecurrenceKind? recurrenceKind,
    HolidayAdjustmentMode? adjustmentMode,
    Set<DateOnly>? completedDates,
  }) {
    return CalendarEvent(
      id: id,
      title: title ?? this.title,
      startDate: startDate ?? this.startDate,
      priority: priority ?? this.priority,
      recurrenceKind: recurrenceKind ?? this.recurrenceKind,
      adjustmentMode: adjustmentMode ?? this.adjustmentMode,
      completedDates: completedDates ?? Set<DateOnly>.from(this.completedDates),
    );
  }
}

class EventOccurrence {
  const EventOccurrence({
    required this.event,
    required this.originalDate,
    required this.date,
  });

  final CalendarEvent event;
  final DateOnly originalDate;
  final DateOnly date;

  bool get wasAdjusted => originalDate != date;
  bool get isCompleted => event.completedDates.contains(date);
}

class CalendarHomePage extends StatefulWidget {
  const CalendarHomePage({
    super.key,
    required this.firebaseEnabled,
    required this.isDarkMode,
    required this.fontScale,
    required this.onSettingsChanged,
  });

  final bool firebaseEnabled;
  final bool isDarkMode;
  final double fontScale;
  final SettingsChanged onSettingsChanged;

  @override
  State<CalendarHomePage> createState() => _CalendarHomePageState();
}

class _CalendarHomePageState extends State<CalendarHomePage> {
  static const _businessWeekdays = {
    DateTime.monday,
    DateTime.tuesday,
    DateTime.wednesday,
    DateTime.thursday,
    DateTime.friday,
  };

  static const _dateSwatches = [
    Color(0xFFFFF3C4),
    Color(0xFFFFD9D6),
    Color(0xFFDFF5E7),
    Color(0xFFDDEBFF),
    Color(0xFFE9E4FF),
  ];

  final _titleController = TextEditingController();
  final _holidayProvider = KoreanHolidayProvider();
  final _holidaySyncService = KoreanHolidaySyncService();
  final _holidaySyncYearsInFlight = <int>{};
  final _events = <CalendarEvent>[];
  final _dateColors = <DateOnly, Color>{};

  CloudSyncService? _cloudSyncService;
  StreamSubscription<User?>? _authSubscription;
  User? _firebaseUser;
  CloudEntitlement _entitlement = CloudEntitlement.free();
  late final BusinessCalendar _businessCalendar;
  LocalCalendarDatabase? _database;
  late DateOnly _today;
  late DateOnly _visibleMonth;
  late DateOnly _selectedDate;
  RecurrenceKind _selectedRecurrence = RecurrenceKind.none;
  HolidayAdjustmentMode _selectedAdjustment = HolidayAdjustmentMode.none;
  int _selectedPriority = 2;
  int _nextId = 1;
  bool _isLoading = true;
  bool _autoSyncEnabled = false;
  bool _cloudActionInProgress = false;
  String? _cloudStatusMessage;

  @override
  void initState() {
    super.initState();
    if (widget.firebaseEnabled) {
      _cloudSyncService = CloudSyncService();
      _authSubscription = _cloudSyncService!.authStateChanges.listen(
        _handleAuthChanged,
      );
      _firebaseUser = _cloudSyncService!.currentUser;
      unawaited(_refreshEntitlement());
    }
    _businessCalendar = BusinessCalendar(
      holidayCalendar: KoreanHolidayCalendar(_holidayProvider),
    );
    final now = DateTime.now();
    _today = DateOnly(now.year, now.month, now.day);
    _visibleMonth = DateOnly(now.year, now.month, 1);
    _selectedDate = _today;
    _loadLocalData();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _authSubscription?.cancel();
    _holidaySyncService.close();
    _database?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final range = _visibleRange(_visibleMonth);
    final monthOccurrences = _occurrencesForRange(range.start, range.end);

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.calendar_month_outlined),
            SizedBox(width: 10),
            Flexible(
              child: Text('Routine Scheduler', overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: '오늘',
            onPressed: _goToday,
            icon: const Icon(Icons.today_outlined),
          ),
          IconButton(
            tooltip: '이용권',
            onPressed: _openPurchaseDialog,
            icon: const Icon(Icons.workspace_premium_outlined),
          ),
          IconButton(
            tooltip: '설정',
            onPressed: _openSettings,
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          const minCalendarHeight = 520.0;
          final content = Padding(
            padding: const EdgeInsets.all(16),
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _MonthPanel(
                    visibleMonth: _visibleMonth,
                    selectedDate: _selectedDate,
                    today: _today,
                    holidayProvider: _holidayProvider,
                    dateColors: _dateColors,
                    occurrences: monthOccurrences,
                    onPreviousMonth: () => _moveMonth(-1),
                    onNextMonth: () => _moveMonth(1),
                    onSelectDate: _selectDate,
                  ),
          );

          if (constraints.maxHeight < minCalendarHeight) {
            return SingleChildScrollView(
              child: SizedBox(height: minCalendarHeight, child: content),
            );
          }

          return content;
        },
      ),
    );
  }

  Future<void> _loadLocalData() async {
    if (Platform.environment['FLUTTER_TEST'] == 'true') {
      setState(() {
        _events.clear();
        _dateColors.clear();
        _seedEvents();
        _isLoading = false;
      });
      return;
    }

    try {
      final database = await LocalCalendarDatabase.open();
      final storedEvents = database.loadEvents();
      final storedMarks = database.loadDateMarks();
      final storedSettings = database.loadSettings();
      _loadStoredHolidays(database, _today.year);
      _loadStoredHolidays(database, _today.year + 1);

      if (!mounted) {
        database.close();
        return;
      }

      widget.onSettingsChanged(
        isDarkMode: storedSettings.isDarkMode,
        fontScale: storedSettings.fontScale,
      );

      setState(() {
        _database = database;
        _autoSyncEnabled = storedSettings.autoSyncEnabled;
        _events
          ..clear()
          ..addAll(storedEvents.map(_eventFromStored));
        _dateColors
          ..clear()
          ..addAll({
            for (final entry in storedMarks.entries)
              _dateFromIso(entry.key): Color(entry.value),
          });
        _nextId = _nextEventId(_events);
        if (_events.isEmpty && _dateColors.isEmpty) {
          _seedEvents();
        }
        _isLoading = false;
      });
      unawaited(_syncHolidaysIfStale(database, _today.year));
      unawaited(_syncHolidaysIfStale(database, _today.year + 1));
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _events.clear();
        _dateColors.clear();
        _seedEvents();
        _isLoading = false;
      });
    }
  }

  void _loadStoredHolidays(LocalCalendarDatabase database, int year) {
    final storedHolidays = database.loadHolidays(year);
    if (storedHolidays.isEmpty) {
      return;
    }

    _holidayProvider.replaceYear(
      year,
      storedHolidays.map(_holidayInfoFromStored),
    );
  }

  void _ensureHolidaysForYear(int year) {
    final database = _database;
    if (database == null || Platform.environment['FLUTTER_TEST'] == 'true') {
      return;
    }

    _loadStoredHolidays(database, year);
    unawaited(_syncHolidaysIfStale(database, year));
  }

  Future<void> _syncHolidaysIfStale(
    LocalCalendarDatabase database,
    int year,
  ) async {
    if (!_holidaySyncYearsInFlight.add(year)) {
      return;
    }

    try {
      final updatedAt = database.holidayLastUpdatedAt(year);
      final shouldSync =
          updatedAt == null ||
          DateTime.now().toUtc().difference(updatedAt.toUtc()) >=
              const Duration(days: 30);
      if (!shouldSync) {
        return;
      }

      final syncedHolidays = await _holidaySyncService.fetchYear(year);
      if (syncedHolidays.isEmpty) {
        return;
      }

      final holidays = _mergeHolidayInfos([
        ...syncedHolidays,
        ..._holidayProvider.builtInHolidaysForYear(year),
      ]);
      database.replaceHolidays(
        year: year,
        holidays: holidays.map(_storedHolidayFromInfo),
      );

      if (!mounted || _database != database) {
        return;
      }

      setState(() => _holidayProvider.replaceYear(year, holidays));
    } catch (_) {
      // Holiday sync is best-effort. Cached and built-in holidays stay usable.
    } finally {
      _holidaySyncYearsInFlight.remove(year);
    }
  }

  bool get _canUseCloudSync {
    return widget.firebaseEnabled &&
        _firebaseUser != null &&
        _entitlement.isActive;
  }

  Future<void> _handleAuthChanged(User? user) async {
    if (!mounted) {
      return;
    }

    setState(() => _firebaseUser = user);
    await _refreshEntitlement();

    if (_autoSyncEnabled && _canUseCloudSync) {
      unawaited(_downloadFromCloud(silent: true));
    }
  }

  Future<void> _refreshEntitlement() async {
    final service = _cloudSyncService;
    if (service == null || service.currentUser == null) {
      if (mounted) {
        setState(() => _entitlement = CloudEntitlement.free());
      }
      return;
    }

    try {
      final entitlement = await service.loadEntitlement();
      if (!mounted) {
        return;
      }
      setState(() => _entitlement = entitlement);
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() => _entitlement = CloudEntitlement.free());
    }
  }

  Future<void> _signInWithGoogle({bool showSnack = true}) async {
    final service = _cloudSyncService;
    if (service == null) {
      _showSnack('Firebase가 아직 초기화되지 않았습니다.');
      return;
    }

    setState(() {
      _cloudActionInProgress = true;
      _cloudStatusMessage = '구글 로그인 중입니다.';
    });

    try {
      final credential = await service.signInWithGoogle();
      if (!mounted) {
        return;
      }

      setState(() => _firebaseUser = credential.user ?? service.currentUser);
      await _refreshEntitlement();
      if (!mounted) {
        return;
      }
      setState(() {
        _firebaseUser ??= service.currentUser;
        _cloudStatusMessage = _firebaseUser == null
            ? '구글 인증은 완료됐지만 앱 세션 반영에 실패했습니다.'
            : '구글 로그인이 완료되었습니다.';
      });
      if (showSnack) {
        _showSnack(_cloudStatusMessage!);
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _cloudStatusMessage = '로그인 실패: $error');
      if (showSnack) {
        _showSnack('로그인 실패: $error');
      }
    } finally {
      if (mounted) {
        setState(() => _cloudActionInProgress = false);
      }
    }
  }

  Future<void> _signOutFromGoogle() async {
    final service = _cloudSyncService;
    if (service == null) {
      return;
    }

    setState(() => _cloudActionInProgress = true);
    try {
      await service.signOut();
      if (!mounted) {
        return;
      }
      setState(() {
        _firebaseUser = null;
        _entitlement = CloudEntitlement.free();
        _cloudStatusMessage = '로그아웃되었습니다.';
      });
    } finally {
      if (mounted) {
        setState(() => _cloudActionInProgress = false);
      }
    }
  }

  Future<void> _uploadToCloud({bool silent = false}) async {
    final service = _cloudSyncService;
    if (service == null) {
      if (!silent) {
        _showSnack('Firebase가 아직 초기화되지 않았습니다.');
      }
      return;
    }
    if (!_canUseCloudSync) {
      if (!silent) {
        _showSnack(_cloudUnavailableMessage);
      }
      return;
    }

    setState(() {
      _cloudActionInProgress = true;
      _cloudStatusMessage = 'Firebase로 업로드 중입니다.';
    });

    try {
      await service.uploadSnapshot(
        events: _events.map(_cloudEventFromEvent),
        dateMarks: {
          for (final entry in _dateColors.entries)
            entry.key.toIso8601String(): entry.value.toARGB32(),
        },
        autoSyncEnabled: _autoSyncEnabled,
      );
      if (!mounted) {
        return;
      }
      setState(() => _cloudStatusMessage = 'Firebase 업로드가 완료되었습니다.');
      if (!silent) {
        _showSnack('Firebase 업로드가 완료되었습니다.');
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _cloudStatusMessage = '업로드 실패: $error');
      if (!silent) {
        _showSnack('업로드 실패: $error');
      }
    } finally {
      if (mounted) {
        setState(() => _cloudActionInProgress = false);
      }
    }
  }

  Future<void> _downloadFromCloud({bool silent = false}) async {
    final service = _cloudSyncService;
    if (service == null) {
      if (!silent) {
        _showSnack('Firebase가 아직 초기화되지 않았습니다.');
      }
      return;
    }
    if (!_canUseCloudSync) {
      if (!silent) {
        _showSnack(_cloudUnavailableMessage);
      }
      return;
    }

    setState(() {
      _cloudActionInProgress = true;
      _cloudStatusMessage = 'Firebase에서 다운로드 중입니다.';
    });

    try {
      final snapshot = await service.downloadSnapshot();
      final downloadedEvents = snapshot.events
          .where((event) => event.title.trim().isNotEmpty)
          .map(_eventFromCloud)
          .toList();
      final downloadedMarks = {
        for (final entry in snapshot.dateMarks.entries)
          _dateFromIso(entry.key): Color(entry.value),
      };

      _database?.replaceCalendarData(
        events: downloadedEvents.map(_storedEventFromEvent),
        dateMarks: snapshot.dateMarks,
      );
      _database?.saveSettings(autoSyncEnabled: snapshot.autoSyncEnabled);

      if (!mounted) {
        return;
      }

      setState(() {
        _events
          ..clear()
          ..addAll(downloadedEvents);
        _dateColors
          ..clear()
          ..addAll(downloadedMarks);
        _autoSyncEnabled = snapshot.autoSyncEnabled;
        _nextId = _nextEventId(_events);
        _cloudStatusMessage = snapshot.isEmpty
            ? 'Firebase에 저장된 일정이 없습니다.'
            : 'Firebase 다운로드가 완료되었습니다.';
      });
      if (!silent) {
        _showSnack(_cloudStatusMessage!);
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _cloudStatusMessage = '다운로드 실패: $error');
      if (!silent) {
        _showSnack('다운로드 실패: $error');
      }
    } finally {
      if (mounted) {
        setState(() => _cloudActionInProgress = false);
      }
    }
  }

  void _setAutoSyncEnabled(bool value) {
    setState(() {
      _autoSyncEnabled = value;
      _cloudStatusMessage = value ? '자동 동기화가 켜졌습니다.' : '자동 동기화가 꺼졌습니다.';
    });
    _database?.saveSettings(autoSyncEnabled: value);
    if (value && _canUseCloudSync) {
      unawaited(_uploadToCloud(silent: true));
    }
  }

  void _queueAutoSync() {
    if (!_autoSyncEnabled || !_canUseCloudSync || _cloudActionInProgress) {
      return;
    }

    unawaited(_uploadToCloud(silent: true));
  }

  String get _cloudUnavailableMessage {
    if (!widget.firebaseEnabled) {
      return 'Firebase가 아직 초기화되지 않았습니다.';
    }
    if (_firebaseUser == null) {
      return '구글 로그인이 필요합니다.';
    }
    return '이용권 결제 후 동기화를 사용할 수 있습니다.';
  }

  void _showSnack(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  void _openSettings() {
    var isDarkMode = widget.isDarkMode;
    var fontScale = _normalizeFontScale(widget.fontScale);

    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (dialogContext, dialogSetState) {
            void applySettings({bool? darkMode, double? scale}) {
              final nextDarkMode = darkMode ?? isDarkMode;
              final nextFontScale = _normalizeFontScale(scale ?? fontScale);
              dialogSetState(() {
                isDarkMode = nextDarkMode;
                fontScale = nextFontScale;
              });
              widget.onSettingsChanged(
                isDarkMode: nextDarkMode,
                fontScale: nextFontScale,
              );
              _database?.saveSettings(
                isDarkMode: nextDarkMode,
                fontScale: nextFontScale,
              );
            }

            Future<void> runAndRefresh(Future<void> Function() action) async {
              await action();
              if (dialogContext.mounted) {
                dialogSetState(() {});
              }
            }

            final percent = (fontScale * 100).round();
            final user = _firebaseUser;
            final canSync = _canUseCloudSync && !_cloudActionInProgress;

            return AlertDialog(
              title: const Text('설정'),
              content: SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 500),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SwitchListTile.adaptive(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('다크 모드'),
                        value: isDarkMode,
                        onChanged: (value) => applySettings(darkMode: value),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              '글씨 크기',
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                          Text(
                            '$percent%',
                            style: Theme.of(context).textTheme.labelLarge
                                ?.copyWith(fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                      Slider(
                        value: fontScale,
                        min: 0.85,
                        max: 1.25,
                        divisions: 8,
                        label: '$percent%',
                        onChanged: (value) => applySettings(scale: value),
                      ),
                      Text(
                        '화면 깨짐을 줄이기 위해 글씨 크기는 85%에서 125% 사이로 제한됩니다.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const Divider(height: 32),
                      Text(
                        '계정 / 동기화',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 8),
                      if (!widget.firebaseEnabled)
                        const Text('Firebase 초기화가 필요합니다.')
                      else if (user == null)
                        const Text('유료 동기화를 사용하려면 구글 로그인이 필요합니다.')
                      else
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.email ?? user.displayName ?? '구글 계정',
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            SelectableText(
                              'UID: ${user.uid}',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.onSurfaceVariant,
                                  ),
                            ),
                          ],
                        ),
                      const SizedBox(height: 8),
                      Text(
                        _entitlement.label,
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      if (_cloudStatusMessage != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          _cloudStatusMessage!,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                              ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          if (user == null)
                            FilledButton.icon(
                              onPressed:
                                  widget.firebaseEnabled &&
                                      !_cloudActionInProgress
                                  ? () => runAndRefresh(_signInWithGoogle)
                                  : null,
                              icon: const Icon(Icons.login),
                              label: const Text('구글 로그인'),
                            )
                          else
                            OutlinedButton.icon(
                              onPressed: !_cloudActionInProgress
                                  ? () => runAndRefresh(_signOutFromGoogle)
                                  : null,
                              icon: const Icon(Icons.logout),
                              label: const Text('로그아웃'),
                            ),
                          OutlinedButton.icon(
                            onPressed: canSync
                                ? () => runAndRefresh(_uploadToCloud)
                                : null,
                            icon: const Icon(Icons.cloud_upload_outlined),
                            label: const Text('동기화 업로드'),
                          ),
                          OutlinedButton.icon(
                            onPressed: canSync
                                ? () => runAndRefresh(_downloadFromCloud)
                                : null,
                            icon: const Icon(Icons.cloud_download_outlined),
                            label: const Text('동기화 다운로드'),
                          ),
                          OutlinedButton.icon(
                            onPressed: user != null && !_cloudActionInProgress
                                ? () => runAndRefresh(_refreshEntitlement)
                                : null,
                            icon: const Icon(Icons.refresh),
                            label: const Text('이용권 새로고침'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      SwitchListTile.adaptive(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('자동 동기화'),
                        subtitle: Text(
                          _canUseCloudSync
                              ? '변경 사항을 Firebase에 자동 업로드합니다.'
                              : _cloudUnavailableMessage,
                        ),
                        value: _autoSyncEnabled,
                        onChanged: _canUseCloudSync
                            ? (value) {
                                _setAutoSyncEnabled(value);
                                dialogSetState(() {});
                              }
                            : null,
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('닫기'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _openPurchaseDialog() {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('이용권'),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _firebaseUser == null
                      ? '구글 로그인 후 결제하면 Firebase 동기화를 사용할 수 있습니다.'
                      : '현재 상태: ${_entitlement.label}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                for (final plan in _purchasePlans)
                  _PurchasePlanTile(
                    plan: plan,
                    onPressed: () {
                      Navigator.of(dialogContext).pop();
                      _showSnack(
                        '${plan.productId} 상품을 스토어 콘솔에 등록한 뒤 결제 SDK와 연결합니다.',
                      );
                    },
                  ),
              ],
            ),
          ),
          actions: [
            if (_firebaseUser == null)
              TextButton.icon(
                onPressed: widget.firebaseEnabled
                    ? () {
                        Navigator.of(dialogContext).pop();
                        unawaited(_signInWithGoogle());
                      }
                    : null,
                icon: const Icon(Icons.login),
                label: const Text('구글 로그인'),
              ),
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('닫기'),
            ),
          ],
        );
      },
    );
  }

  void _seedEvents() {
    final seededEvents = [
      CalendarEvent(
        id: 'seed-${_nextId++}',
        title: '월초 보고',
        startDate: _today,
        priority: 3,
        recurrenceKind: RecurrenceKind.monthlyFirstWeekday,
        adjustmentMode: HolidayAdjustmentMode.nextBusinessDay,
      ),
      CalendarEvent(
        id: 'seed-${_nextId++}',
        title: '월말 정산',
        startDate: _today,
        priority: 2,
        recurrenceKind: RecurrenceKind.monthlyLastWeekday,
        adjustmentMode: HolidayAdjustmentMode.previousBusinessDay,
      ),
    ];
    _events.addAll(seededEvents);
    _dateColors[_today] = const Color(0xFFDDEBFF);
    for (final event in seededEvents) {
      _database?.saveEvent(
        id: event.id,
        title: event.title,
        startDate: event.startDate.toIso8601String(),
        priority: event.priority,
        recurrenceKind: event.recurrenceKind.name,
        adjustmentMode: event.adjustmentMode.name,
      );
    }
    _database?.setDateMark(
      date: _today.toIso8601String(),
      colorValue: const Color(0xFFDDEBFF).toARGB32(),
    );
  }

  void _moveMonth(int delta) {
    setState(() {
      _visibleMonth = _addMonths(_visibleMonth, delta);
      _selectedDate = _clampSelectedDateToVisibleMonth(_selectedDate);
    });
    _ensureHolidaysForYear(_visibleMonth.year);
  }

  void _goToday() {
    setState(() {
      _today = _todayDate();
      _visibleMonth = DateOnly(_today.year, _today.month, 1);
      _selectedDate = _today;
    });
    _ensureHolidaysForYear(_visibleMonth.year);
  }

  void _selectDate(DateOnly date) {
    setState(() {
      _selectedDate = date;
      _visibleMonth = DateOnly(date.year, date.month, 1);
    });
    _ensureHolidaysForYear(date.year);
    _openDateDetails();
  }

  void _openDateDetails() {
    showDialog<void>(
      context: context,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, sheetSetState) {
            void refreshSheet() => sheetSetState(() {});

            return Dialog(
              insetPadding: const EdgeInsets.all(24),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  maxWidth: 760,
                  maxHeight: 720,
                ),
                child: SingleChildScrollView(
                  child: _SchedulePanel(
                    selectedDate: _selectedDate,
                    holiday: _holidayProvider.holidayOn(_selectedDate),
                    occurrences: _occurrencesForDate(_selectedDate),
                    dateColor: _dateColors[_selectedDate],
                    swatches: _dateSwatches,
                    onOpenAddEvent: () => _openAddEventDialog(refreshSheet),
                    onDeleteEvent: (event) {
                      _deleteEvent(event);
                      refreshSheet();
                    },
                    onToggleComplete: (occurrence) {
                      _toggleComplete(occurrence);
                      refreshSheet();
                    },
                    onSetDateColor: (color) {
                      _setDateColor(color);
                      refreshSheet();
                    },
                    onClearDateColor: () {
                      _clearDateColor();
                      refreshSheet();
                    },
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _openAddEventDialog(VoidCallback refreshDateSheet) {
    _titleController.clear();
    var recurrenceKind = _selectedRecurrence;
    var adjustmentMode = _selectedAdjustment;
    var priority = _selectedPriority;

    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (dialogContext, dialogSetState) {
            void save() {
              final added = _addEvent(
                recurrenceKind: recurrenceKind,
                adjustmentMode: adjustmentMode,
                priority: priority,
              );
              if (!added) {
                return;
              }

              Navigator.of(dialogContext).pop();
              refreshDateSheet();
            }

            return AlertDialog(
              title: Text('$_selectedDate 일정 추가'),
              content: SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: _AddEventForm(
                    titleController: _titleController,
                    recurrenceKind: recurrenceKind,
                    adjustmentMode: adjustmentMode,
                    priority: priority,
                    onRecurrenceChanged: (value) {
                      if (value == null) {
                        return;
                      }
                      dialogSetState(() => recurrenceKind = value);
                    },
                    onAdjustmentChanged: (value) {
                      if (value == null) {
                        return;
                      }
                      dialogSetState(() => adjustmentMode = value);
                    },
                    onPriorityChanged: (value) {
                      dialogSetState(() => priority = value);
                    },
                    onSubmit: save,
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('취소'),
                ),
                FilledButton.icon(
                  onPressed: save,
                  icon: const Icon(Icons.save_outlined),
                  label: const Text('저장'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  bool _addEvent({
    required RecurrenceKind recurrenceKind,
    required HolidayAdjustmentMode adjustmentMode,
    required int priority,
  }) {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      return false;
    }

    setState(() {
      _selectedRecurrence = recurrenceKind;
      _selectedAdjustment = adjustmentMode;
      _selectedPriority = priority;
      _events.add(
        CalendarEvent(
          id: 'event-${_nextId++}',
          title: title,
          startDate: _selectedDate,
          priority: priority,
          recurrenceKind: recurrenceKind,
          adjustmentMode: adjustmentMode,
        ),
      );
      _database?.saveEvent(
        id: 'event-${_nextId - 1}',
        title: title,
        startDate: _selectedDate.toIso8601String(),
        priority: priority,
        recurrenceKind: recurrenceKind.name,
        adjustmentMode: adjustmentMode.name,
      );
      _titleController.clear();
    });
    _queueAutoSync();
    return true;
  }

  void _deleteEvent(CalendarEvent event) {
    setState(() => _events.removeWhere((item) => item.id == event.id));
    _database?.deleteEvent(event.id);
    _queueAutoSync();
  }

  void _toggleComplete(EventOccurrence occurrence) {
    setState(() {
      final eventIndex = _events.indexWhere(
        (event) => event.id == occurrence.event.id,
      );
      if (eventIndex == -1) {
        return;
      }

      final completedDates = Set<DateOnly>.from(
        _events[eventIndex].completedDates,
      );
      if (completedDates.contains(occurrence.date)) {
        completedDates.remove(occurrence.date);
      } else {
        completedDates.add(occurrence.date);
      }

      _events[eventIndex] = _events[eventIndex].copyWith(
        completedDates: completedDates,
      );
    });
    _database?.setOccurrenceCompleted(
      eventId: occurrence.event.id,
      date: occurrence.date.toIso8601String(),
      isCompleted: _events
          .firstWhere((event) => event.id == occurrence.event.id)
          .completedDates
          .contains(occurrence.date),
    );
    _queueAutoSync();
  }

  void _setDateColor(Color color) {
    setState(() => _dateColors[_selectedDate] = color);
    _database?.setDateMark(
      date: _selectedDate.toIso8601String(),
      colorValue: color.toARGB32(),
    );
    _queueAutoSync();
  }

  void _clearDateColor() {
    setState(() => _dateColors.remove(_selectedDate));
    _database?.clearDateMark(_selectedDate.toIso8601String());
    _queueAutoSync();
  }

  List<EventOccurrence> _occurrencesForDate(DateOnly date) {
    return _occurrencesForRange(date, date);
  }

  List<EventOccurrence> _occurrencesForRange(DateOnly from, DateOnly to) {
    final occurrences = <EventOccurrence>[];
    final bufferedFrom = from.addDays(-14);
    final bufferedTo = to.addDays(14);

    for (final event in _events) {
      final eventOccurrences =
          _eventOccurrences(event, from: bufferedFrom, to: bufferedTo).where((
            occurrence,
          ) {
            return occurrence.date.compareTo(from) >= 0 &&
                occurrence.date.compareTo(to) <= 0;
          });
      occurrences.addAll(eventOccurrences);
    }

    occurrences.sort((a, b) {
      final dateCompare = a.date.compareTo(b.date);
      if (dateCompare != 0) {
        return dateCompare;
      }
      return _compareOccurrencesForDisplay(a, b);
    });

    return occurrences;
  }

  Iterable<EventOccurrence> _eventOccurrences(
    CalendarEvent event, {
    required DateOnly from,
    required DateOnly to,
  }) sync* {
    final originals = _originalDatesForEvent(event, from: from, to: to);

    for (final originalDate in originals) {
      if (originalDate.compareTo(event.startDate) < 0) {
        continue;
      }

      final adjustedDate = event.adjustmentMode.policy.apply(
        originalDate,
        _businessCalendar,
      );
      if (adjustedDate == null) {
        continue;
      }

      yield EventOccurrence(
        event: event,
        originalDate: originalDate,
        date: adjustedDate,
      );
    }
  }

  Iterable<DateOnly> _originalDatesForEvent(
    CalendarEvent event, {
    required DateOnly from,
    required DateOnly to,
  }) sync* {
    switch (event.recurrenceKind) {
      case RecurrenceKind.none:
        if (event.startDate.compareTo(from) >= 0 &&
            event.startDate.compareTo(to) <= 0) {
          yield event.startDate;
        }
      case RecurrenceKind.daily:
        var cursor = _maxDate(event.startDate, from);
        while (cursor.compareTo(to) <= 0) {
          yield cursor;
          cursor = cursor.addDays(1);
        }
      case RecurrenceKind.monthlyByDay:
        yield* MonthlyByMonthDay(
          day: event.startDate.day,
        ).generate(from: from, to: to);
      case RecurrenceKind.yearlyByMonthDay:
        yield* YearlyByMonthDay(
          month: event.startDate.month,
          day: event.startDate.day,
        ).generate(from: from, to: to);
      case RecurrenceKind.monthlyNthWeekday:
        yield* MonthlyNthWeekday(
          nth: _nthWeekdayInMonth(event.startDate),
          weekday: event.startDate.weekday,
        ).generate(from: from, to: to);
      case RecurrenceKind.monthlyFirstWeekday:
        yield* MonthlyByWeekdaysSetPosition(
          weekdays: _businessWeekdays,
          setPosition: 1,
        ).generate(from: from, to: to);
      case RecurrenceKind.monthlyLastWeekday:
        yield* MonthlyByWeekdaysSetPosition(
          weekdays: _businessWeekdays,
          setPosition: -1,
        ).generate(from: from, to: to);
    }
  }

  String recurrenceSummary(CalendarEvent event) {
    final pattern = _patternForEvent(event);
    if (pattern == null) {
      return event.recurrenceKind.label;
    }

    final rrule = pattern.toRRule();
    return '${event.recurrenceKind.label} · $rrule';
  }

  RecurrencePattern? _patternForEvent(CalendarEvent event) {
    return switch (event.recurrenceKind) {
      RecurrenceKind.none => null,
      RecurrenceKind.daily => null,
      RecurrenceKind.monthlyByDay => MonthlyByMonthDay(
        day: event.startDate.day,
      ),
      RecurrenceKind.yearlyByMonthDay => YearlyByMonthDay(
        month: event.startDate.month,
        day: event.startDate.day,
      ),
      RecurrenceKind.monthlyNthWeekday => MonthlyNthWeekday(
        nth: _nthWeekdayInMonth(event.startDate),
        weekday: event.startDate.weekday,
      ),
      RecurrenceKind.monthlyFirstWeekday => MonthlyByWeekdaysSetPosition(
        weekdays: _businessWeekdays,
        setPosition: 1,
      ),
      RecurrenceKind.monthlyLastWeekday => MonthlyByWeekdaysSetPosition(
        weekdays: _businessWeekdays,
        setPosition: -1,
      ),
    };
  }

  _DateRange _visibleRange(DateOnly month) {
    return _DateRange(
      start: DateOnly(month.year, month.month, 1),
      end: DateOnly(
        month.year,
        month.month,
        DateOnly.daysInMonth(month.year, month.month),
      ),
    );
  }

  DateOnly _clampSelectedDateToVisibleMonth(DateOnly selectedDate) {
    final daysInMonth = DateOnly.daysInMonth(
      _visibleMonth.year,
      _visibleMonth.month,
    );
    return DateOnly(
      _visibleMonth.year,
      _visibleMonth.month,
      selectedDate.day > daysInMonth ? daysInMonth : selectedDate.day,
    );
  }
}

class _DateRange {
  const _DateRange({required this.start, required this.end});

  final DateOnly start;
  final DateOnly end;
}

class _PurchasePlan {
  const _PurchasePlan({
    required this.productId,
    required this.label,
    required this.price,
  });

  final String productId;
  final String label;
  final String price;
}

const _purchasePlans = [
  _PurchasePlan(
    productId: 'routine_sync_3m',
    label: '3개월 이용권',
    price: '3,900원',
  ),
  _PurchasePlan(
    productId: 'routine_sync_6m',
    label: '6개월 이용권',
    price: '7,200원',
  ),
  _PurchasePlan(
    productId: 'routine_sync_1y',
    label: '1년 이용권',
    price: '13,200원',
  ),
  _PurchasePlan(
    productId: 'routine_sync_lifetime',
    label: '평생 이용권',
    price: '19,900원',
  ),
];

class _MonthPanel extends StatelessWidget {
  const _MonthPanel({
    required this.visibleMonth,
    required this.selectedDate,
    required this.today,
    required this.holidayProvider,
    required this.dateColors,
    required this.occurrences,
    required this.onPreviousMonth,
    required this.onNextMonth,
    required this.onSelectDate,
  });

  final DateOnly visibleMonth;
  final DateOnly selectedDate;
  final DateOnly today;
  final KoreanHolidayProvider holidayProvider;
  final Map<DateOnly, Color> dateColors;
  final List<EventOccurrence> occurrences;
  final VoidCallback onPreviousMonth;
  final VoidCallback onNextMonth;
  final ValueChanged<DateOnly> onSelectDate;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.max,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  _monthTitle(visibleMonth),
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const Spacer(),
                IconButton(
                  tooltip: '이전 달',
                  onPressed: onPreviousMonth,
                  icon: const Icon(Icons.chevron_left),
                ),
                IconButton(
                  tooltip: '다음 달',
                  onPressed: onNextMonth,
                  icon: const Icon(Icons.chevron_right),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const _WeekdayHeader(),
            const SizedBox(height: 8),
            Expanded(
              child: _MonthGrid(
                visibleMonth: visibleMonth,
                selectedDate: selectedDate,
                today: today,
                holidayProvider: holidayProvider,
                dateColors: dateColors,
                occurrences: occurrences,
                onSelectDate: onSelectDate,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WeekdayHeader extends StatelessWidget {
  const _WeekdayHeader();

  static const labels = ['일', '월', '화', '수', '목', '금', '토'];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (final label in labels)
          Expanded(
            child: Center(
              child: Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.visibleMonth,
    required this.selectedDate,
    required this.today,
    required this.holidayProvider,
    required this.dateColors,
    required this.occurrences,
    required this.onSelectDate,
  });

  final DateOnly visibleMonth;
  final DateOnly selectedDate;
  final DateOnly today;
  final KoreanHolidayProvider holidayProvider;
  final Map<DateOnly, Color> dateColors;
  final List<EventOccurrence> occurrences;
  final ValueChanged<DateOnly> onSelectDate;

  @override
  Widget build(BuildContext context) {
    final firstOfMonth = DateOnly(visibleMonth.year, visibleMonth.month, 1);
    final leadingDays = firstOfMonth.weekday % 7;
    final gridStart = firstOfMonth.addDays(-leadingDays);
    final occurrencesByDate = <DateOnly, List<EventOccurrence>>{};

    for (final occurrence in occurrences) {
      occurrencesByDate
          .putIfAbsent(occurrence.date, () => <EventOccurrence>[])
          .add(occurrence);
    }

    for (final dayOccurrences in occurrencesByDate.values) {
      dayOccurrences.sort(_compareOccurrencesForDisplay);
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final cellWidth = constraints.maxWidth / 7;
        final cellHeight = constraints.maxHeight / 6;
        final aspectRatio = cellHeight == 0 ? 1.0 : cellWidth / cellHeight;

        return GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            childAspectRatio: aspectRatio,
          ),
          itemCount: 42,
          itemBuilder: (context, index) {
            final date = gridStart.addDays(index);
            return _DayCell(
              date: date,
              isCurrentMonth: date.month == visibleMonth.month,
              isSelected: date == selectedDate,
              isToday: date == today,
              holiday: holidayProvider.holidayOn(date),
              color: dateColors[date],
              occurrences: occurrencesByDate[date] ?? const [],
              onTap: () => onSelectDate(date),
            );
          },
        );
      },
    );
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({
    required this.date,
    required this.isCurrentMonth,
    required this.isSelected,
    required this.isToday,
    required this.holiday,
    required this.color,
    required this.occurrences,
    required this.onTap,
  });

  final DateOnly date;
  final bool isCurrentMonth;
  final bool isSelected;
  final bool isToday;
  final HolidayInfo? holiday;
  final Color? color;
  final List<EventOccurrence> occurrences;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor =
        color ??
        (isCurrentMonth
            ? (isDark ? const Color(0xFF111827) : Colors.white)
            : (isDark ? const Color(0xFF1E293B) : const Color(0xFFD1D5DB)));
    final borderColor = isSelected
        ? colorScheme.primary
        : isToday
        ? const Color(0xFF0F766E)
        : isCurrentMonth
        ? (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))
        : (isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1));
    final foregroundColor = isCurrentMonth
        ? holiday == null
              ? (isDark ? const Color(0xFFE5E7EB) : const Color(0xFF172026))
              : const Color(0xFFB91C1C)
        : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B));

    return Padding(
      padding: const EdgeInsets.all(3),
      child: Tooltip(
        message: date.toString(),
        child: InkWell(
          borderRadius: BorderRadius.circular(6),
          onTap: onTap,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: isSelected
                    ? Color.alphaBlend(
                        colorScheme.primary.withAlpha(30),
                        baseColor,
                      )
                    : baseColor,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: borderColor,
                  width: isSelected || isToday ? 2 : 1,
                ),
              ),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isTiny = constraints.maxHeight < 54;
                  final isCompact = constraints.maxHeight < 76;
                  final padding = isTiny ? 3.0 : 6.0;

                  return Padding(
                    padding: EdgeInsets.all(padding),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                '${date.day}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(
                                      color: foregroundColor,
                                      fontWeight: isToday || isSelected
                                          ? FontWeight.w900
                                          : FontWeight.w700,
                                    ),
                              ),
                            ),
                            if (isToday && !isTiny)
                              Flexible(
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0F766E),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      'TODAY',
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelSmall
                                          ?.copyWith(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w900,
                                            height: 1,
                                          ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        if (!isCompact &&
                            isCurrentMonth &&
                            holiday != null) ...[
                          const SizedBox(height: 3),
                          Text(
                            holiday!.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(
                                  color: const Color(0xFFB91C1C),
                                  fontWeight: FontWeight.w900,
                                  height: 1,
                                ),
                          ),
                        ],
                        if (!isTiny) const SizedBox(height: 3),
                        if (!isCompact && isCurrentMonth)
                          Expanded(
                            child: _DayCellEventPreview(
                              occurrences: occurrences,
                              isCurrentMonth: isCurrentMonth,
                            ),
                          )
                        else
                          const Spacer(),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _DayCellEventPreview extends StatelessWidget {
  const _DayCellEventPreview({
    required this.occurrences,
    required this.isCurrentMonth,
  });

  final List<EventOccurrence> occurrences;
  final bool isCurrentMonth;

  @override
  Widget build(BuildContext context) {
    if (occurrences.isEmpty) {
      return const SizedBox.shrink();
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        const itemHeight = 18.0;
        if (constraints.maxHeight < itemHeight) {
          return const SizedBox.shrink();
        }

        final maxItems = (constraints.maxHeight / itemHeight).floor().clamp(
          1,
          5,
        );
        final needsMoreLine = occurrences.length > maxItems && maxItems > 1;
        final visibleCount = needsMoreLine ? maxItems - 1 : maxItems;
        final visibleOccurrences = occurrences.take(visibleCount).toList();
        final hiddenCount = occurrences.length - visibleOccurrences.length;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final occurrence in visibleOccurrences)
              _DayCellEventLine(
                occurrence: occurrence,
                isCurrentMonth: isCurrentMonth,
                height: itemHeight,
              ),
            if (hiddenCount > 0 && needsMoreLine)
              SizedBox(
                height: itemHeight,
                child: Text(
                  '+$hiddenCount',
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _DayCellEventLine extends StatelessWidget {
  const _DayCellEventLine({
    required this.occurrence,
    required this.isCurrentMonth,
    required this.height,
  });

  final EventOccurrence occurrence;
  final bool isCurrentMonth;
  final double height;

  @override
  Widget build(BuildContext context) {
    final textColor = isCurrentMonth
        ? const Color(0xFF334155)
        : const Color(0xFF94A3B8);

    return SizedBox(
      height: height,
      child: Row(
        children: [
          Text(
            _priorityStars(occurrence.event.priority),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: occurrence.event.priority == 3
                  ? const Color(0xFFB45309)
                  : const Color(0xFF64748B),
              fontWeight: FontWeight.w900,
              height: 1,
            ),
          ),
          const SizedBox(width: 3),
          Expanded(
            child: Text(
              occurrence.event.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: textColor,
                fontWeight: FontWeight.w800,
                decoration: occurrence.isCompleted
                    ? TextDecoration.lineThrough
                    : null,
                height: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SchedulePanel extends StatelessWidget {
  const _SchedulePanel({
    required this.selectedDate,
    required this.holiday,
    required this.occurrences,
    required this.dateColor,
    required this.swatches,
    required this.onOpenAddEvent,
    required this.onDeleteEvent,
    required this.onToggleComplete,
    required this.onSetDateColor,
    required this.onClearDateColor,
  });

  final DateOnly selectedDate;
  final HolidayInfo? holiday;
  final List<EventOccurrence> occurrences;
  final Color? dateColor;
  final List<Color> swatches;
  final VoidCallback onOpenAddEvent;
  final ValueChanged<CalendarEvent> onDeleteEvent;
  final ValueChanged<EventOccurrence> onToggleComplete;
  final ValueChanged<Color> onSetDateColor;
  final VoidCallback onClearDateColor;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.event_available_outlined),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    selectedDate.toString(),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
            if (holiday != null) ...[
              const SizedBox(height: 8),
              Text(
                holiday!.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: const Color(0xFFB91C1C),
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                FilledButton.icon(
                  onPressed: onOpenAddEvent,
                  icon: const Icon(Icons.add),
                  label: const Text('일정 추가'),
                ),
                const Spacer(),
                Text(
                  '전체 ${occurrences.length}',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const Divider(height: 28),
            Row(
              children: [
                Text(
                  '스케줄',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${occurrences.length}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (occurrences.isEmpty)
              const _EmptySchedule()
            else
              for (final occurrence in occurrences)
                _ScheduleTile(
                  occurrence: occurrence,
                  onToggleComplete: () => onToggleComplete(occurrence),
                  onDelete: () => onDeleteEvent(occurrence.event),
                ),
            const Divider(height: 28),
            _DateColorSelector(
              selectedColor: dateColor,
              swatches: swatches,
              onSetColor: onSetDateColor,
              onClearColor: onClearDateColor,
            ),
          ],
        ),
      ),
    );
  }
}

class _AddEventForm extends StatelessWidget {
  const _AddEventForm({
    required this.titleController,
    required this.recurrenceKind,
    required this.adjustmentMode,
    required this.priority,
    required this.onRecurrenceChanged,
    required this.onAdjustmentChanged,
    required this.onPriorityChanged,
    required this.onSubmit,
  });

  final TextEditingController titleController;
  final RecurrenceKind recurrenceKind;
  final HolidayAdjustmentMode adjustmentMode;
  final int priority;
  final ValueChanged<RecurrenceKind?> onRecurrenceChanged;
  final ValueChanged<HolidayAdjustmentMode?> onAdjustmentChanged;
  final ValueChanged<int> onPriorityChanged;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: titleController,
          decoration: const InputDecoration(
            labelText: '일정 제목',
            prefixIcon: Icon(Icons.edit_calendar_outlined),
          ),
          onSubmitted: (_) => onSubmit(),
        ),
        const SizedBox(height: 10),
        _PrioritySelector(priority: priority, onChanged: onPriorityChanged),
        const SizedBox(height: 10),
        DropdownButtonFormField<RecurrenceKind>(
          initialValue: recurrenceKind,
          decoration: const InputDecoration(
            labelText: '반복 조건',
            prefixIcon: Icon(Icons.repeat),
          ),
          items: [
            for (final kind in RecurrenceKind.values)
              DropdownMenuItem(value: kind, child: Text(kind.label)),
          ],
          onChanged: onRecurrenceChanged,
        ),
        const SizedBox(height: 10),
        DropdownButtonFormField<HolidayAdjustmentMode>(
          initialValue: adjustmentMode,
          decoration: const InputDecoration(
            labelText: '휴일/업무일 보정',
            prefixIcon: Icon(Icons.business_center_outlined),
          ),
          items: [
            for (final mode in HolidayAdjustmentMode.values)
              DropdownMenuItem(value: mode, child: Text(mode.label)),
          ],
          onChanged: onAdjustmentChanged,
        ),
      ],
    );
  }
}

class _PrioritySelector extends StatelessWidget {
  const _PrioritySelector({required this.priority, required this.onChanged});

  final int priority;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return InputDecorator(
      decoration: const InputDecoration(
        labelText: '중요도',
        prefixIcon: Icon(Icons.star_outline),
      ),
      child: Wrap(
        spacing: 8,
        children: [
          for (var value = 1; value <= 3; value++)
            ChoiceChip(
              label: Text(_priorityStars(value)),
              selected: priority == value,
              onSelected: (_) => onChanged(value),
            ),
        ],
      ),
    );
  }
}

class _DateColorSelector extends StatelessWidget {
  const _DateColorSelector({
    required this.selectedColor,
    required this.swatches,
    required this.onSetColor,
    required this.onClearColor,
  });

  final Color? selectedColor;
  final List<Color> swatches;
  final ValueChanged<Color> onSetColor;
  final VoidCallback onClearColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              '날짜 칸 색',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
            ),
            const Spacer(),
            TextButton.icon(
              onPressed: selectedColor == null ? null : onClearColor,
              icon: const Icon(Icons.format_color_reset),
              label: const Text('지우기'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 10,
          children: [
            for (final color in swatches)
              Tooltip(
                message: '색 칠하기',
                child: InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: () => onSetColor(color),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: selectedColor == color
                            ? Theme.of(context).colorScheme.primary
                            : const Color(0xFFCBD5E1),
                        width: selectedColor == color ? 3 : 1,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _EmptySchedule extends StatelessWidget {
  const _EmptySchedule();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(
        '선택한 날짜에 일정이 없습니다.',
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: const Color(0xFF64748B),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _PurchasePlanTile extends StatelessWidget {
  const _PurchasePlanTile({required this.plan, required this.onPressed});

  final _PurchasePlan plan;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Row(
        children: [
          const Icon(Icons.workspace_premium_outlined),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  plan.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w900),
                ),
                Text(
                  plan.productId,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          FilledButton(onPressed: onPressed, child: Text(plan.price)),
        ],
      ),
    );
  }
}

class _ScheduleTile extends StatelessWidget {
  const _ScheduleTile({
    required this.occurrence,
    required this.onToggleComplete,
    required this.onDelete,
  });

  final EventOccurrence occurrence;
  final VoidCallback onToggleComplete;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final event = occurrence.event;
    final isCompleted = occurrence.isCompleted;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isCompleted ? const Color(0xFFF0FDF4) : Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(value: isCompleted, onChanged: (_) => onToggleComplete()),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      _priorityStars(event.priority),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: event.priority == 3
                            ? const Color(0xFFB45309)
                            : const Color(0xFF64748B),
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        event.title,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                          decoration: isCompleted
                              ? TextDecoration.lineThrough
                              : null,
                          color: isCompleted
                              ? const Color(0xFF64748B)
                              : const Color(0xFF172026),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  _eventMetaText(event, occurrence),
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: '일정 삭제',
            onPressed: onDelete,
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
    );
  }
}

String _eventMetaText(CalendarEvent event, EventOccurrence occurrence) {
  final adjustedText = occurrence.wasAdjusted
      ? ' · ${occurrence.originalDate}에서 보정'
      : '';
  final adjustmentText = event.adjustmentMode == HolidayAdjustmentMode.none
      ? ''
      : ' · ${event.adjustmentMode.label}';
  return '중요도 ${_priorityStars(event.priority)} · ${event.recurrenceKind.label}$adjustmentText$adjustedText';
}

int _compareOccurrencesForDisplay(EventOccurrence a, EventOccurrence b) {
  final priorityCompare = b.event.priority.compareTo(a.event.priority);
  if (priorityCompare != 0) {
    return priorityCompare;
  }

  final completionCompare = a.isCompleted == b.isCompleted
      ? 0
      : a.isCompleted
      ? 1
      : -1;
  if (completionCompare != 0) {
    return completionCompare;
  }

  return a.event.title.compareTo(b.event.title);
}

String _priorityStars(int priority) {
  return ''.padLeft(priority, '★');
}

CalendarEvent _eventFromStored(StoredEvent event) {
  return CalendarEvent(
    id: event.id,
    title: event.title,
    startDate: _dateFromIso(event.startDate),
    priority: event.priority,
    recurrenceKind: _enumByName(
      RecurrenceKind.values,
      event.recurrenceKind,
      RecurrenceKind.none,
    ),
    adjustmentMode: _enumByName(
      HolidayAdjustmentMode.values,
      event.adjustmentMode,
      HolidayAdjustmentMode.none,
    ),
    completedDates: event.completedDates.map(_dateFromIso).toSet(),
  );
}

CalendarEvent _eventFromCloud(CloudCalendarEvent event) {
  return CalendarEvent(
    id: event.id,
    title: event.title,
    startDate: _dateFromIso(event.startDate),
    priority: event.priority.clamp(1, 3).toInt(),
    recurrenceKind: _enumByName(
      RecurrenceKind.values,
      event.recurrenceKind,
      RecurrenceKind.none,
    ),
    adjustmentMode: _enumByName(
      HolidayAdjustmentMode.values,
      event.adjustmentMode,
      HolidayAdjustmentMode.none,
    ),
    completedDates: event.completedDates.map(_dateFromIso).toSet(),
  );
}

CloudCalendarEvent _cloudEventFromEvent(CalendarEvent event) {
  return CloudCalendarEvent(
    id: event.id,
    title: event.title,
    startDate: event.startDate.toIso8601String(),
    priority: event.priority,
    recurrenceKind: event.recurrenceKind.name,
    adjustmentMode: event.adjustmentMode.name,
    completedDates: event.completedDates
        .map((date) => date.toIso8601String())
        .toSet(),
  );
}

StoredEvent _storedEventFromEvent(CalendarEvent event) {
  return StoredEvent(
    id: event.id,
    title: event.title,
    startDate: event.startDate.toIso8601String(),
    priority: event.priority,
    recurrenceKind: event.recurrenceKind.name,
    adjustmentMode: event.adjustmentMode.name,
    completedDates: event.completedDates
        .map((date) => date.toIso8601String())
        .toSet(),
  );
}

HolidayInfo _holidayInfoFromStored(StoredHoliday holiday) {
  return HolidayInfo(
    date: _dateFromIso(holiday.date),
    name: holiday.name,
    isSubstitute: holiday.isSubstitute,
  );
}

StoredHoliday _storedHolidayFromInfo(HolidayInfo holiday) {
  return StoredHoliday(
    date: holiday.date.toIso8601String(),
    name: holiday.name,
    isSubstitute: holiday.isSubstitute,
  );
}

List<HolidayInfo> _mergeHolidayInfos(Iterable<HolidayInfo> holidays) {
  final byDate = <DateOnly, HolidayInfo>{};
  for (final holiday in holidays) {
    byDate[holiday.date] = holiday;
  }
  return byDate.values.toList()..sort((a, b) => a.date.compareTo(b.date));
}

T _enumByName<T extends Enum>(List<T> values, String name, T fallback) {
  for (final value in values) {
    if (value.name == name) {
      return value;
    }
  }
  return fallback;
}

DateOnly _dateFromIso(String value) {
  final parts = value.split('-').map(int.parse).toList();
  if (parts.length != 3) {
    throw FormatException('Expected yyyy-MM-dd.', value);
  }
  return DateOnly(parts[0], parts[1], parts[2]);
}

int _nextEventId(List<CalendarEvent> events) {
  var maxId = 0;
  for (final event in events) {
    final match = RegExp(r'(\d+)$').firstMatch(event.id);
    if (match == null) {
      continue;
    }
    final idNumber = int.tryParse(match.group(1)!);
    if (idNumber != null && idNumber > maxId) {
      maxId = idNumber;
    }
  }
  return maxId + 1;
}

DateOnly _todayDate() {
  final now = DateTime.now();
  return DateOnly(now.year, now.month, now.day);
}

DateOnly _addMonths(DateOnly month, int delta) {
  final date = DateTime.utc(month.year, month.month + delta, 1);
  return DateOnly(date.year, date.month, 1);
}

DateOnly _maxDate(DateOnly a, DateOnly b) {
  return a.compareTo(b) >= 0 ? a : b;
}

int _nthWeekdayInMonth(DateOnly date) {
  return ((date.day - 1) ~/ 7) + 1;
}

String _monthTitle(DateOnly month) {
  return '${month.year}.${month.month.toString().padLeft(2, '0')}';
}
