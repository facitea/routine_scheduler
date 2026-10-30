import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'desktop_google_oauth.dart';
import 'firebase_options.dart';

class CloudSyncService {
  CloudSyncService({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
    GoogleSignIn? googleSignIn,
  }) : _auth = auth ?? FirebaseAuth.instance,
       _firestore = firestore ?? FirebaseFirestore.instance,
       _googleSignIn = googleSignIn ?? GoogleSignIn.instance;

  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;
  final GoogleSignIn _googleSignIn;
  var _googleSignInInitialized = false;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<UserCredential> signInWithGoogle() async {
    final credential = await _signInWithGoogleCredential();
    if (credential.user == null) {
      throw const CloudSyncException('구글 로그인은 끝났지만 Firebase 세션이 만들어지지 않았습니다.');
    }
    return credential;
  }

  Future<UserCredential> _signInWithGoogleCredential() async {
    if (kIsWeb) {
      return _auth.signInWithPopup(GoogleAuthProvider());
    }

    if (Platform.isAndroid || Platform.isIOS) {
      await _initializeGoogleSignIn();
      final account = await _googleSignIn.authenticate();
      final authentication = account.authentication;
      final credential = GoogleAuthProvider.credential(
        idToken: authentication.idToken,
      );
      return _auth.signInWithCredential(credential);
    }

    if (Platform.isWindows) {
      final desktopClientId =
          DefaultFirebaseOptions.windowsDesktopOAuthClientId;
      final desktopClientSecret =
          DefaultFirebaseOptions.windowsDesktopOAuthClientSecret;
      final expectedProjectNumber =
          DefaultFirebaseOptions.windows.messagingSenderId;
      if (!desktopClientId.startsWith('$expectedProjectNumber-')) {
        throw CloudSyncException(
          'Windows Desktop OAuth Client ID가 현재 Firebase 프로젝트와 다릅니다. '
          '현재 Firebase 프로젝트 번호는 $expectedProjectNumber이고, '
          '설정된 Windows Client ID는 ${_maskClientId(desktopClientId)} 입니다. '
          '같은 Google Cloud/Firebase 프로젝트에서 Desktop app OAuth Client를 다시 만들어야 합니다.',
        );
      }

      final tokens = await DesktopGoogleOAuth(
        clientId: desktopClientId,
        clientSecret: desktopClientSecret,
      ).authenticate();
      final credential = GoogleAuthProvider.credential(
        idToken: tokens.idToken,
        accessToken: tokens.accessToken,
      );
      return _auth.signInWithCredential(credential);
    }

    throw const CloudSyncException('이 플랫폼에서는 구글 로그인을 아직 지원하지 않습니다.');
  }

  Future<void> signOut() async {
    if (_googleSignInInitialized && (Platform.isAndroid || Platform.isIOS)) {
      await _googleSignIn.signOut();
    }
    await _auth.signOut();
  }

  Future<CloudEntitlement> loadEntitlement() async {
    final user = _requireUser();
    final snapshot = await _userDoc(user.uid).get();
    final data = snapshot.data();
    final entitlement = data?['entitlement'];
    if (entitlement is! Map<String, dynamic>) {
      return CloudEntitlement.free();
    }
    return CloudEntitlement.fromJson(entitlement);
  }

  Future<void> uploadSnapshot({
    required Iterable<CloudCalendarEvent> events,
    required Map<String, int> dateMarks,
    required bool autoSyncEnabled,
  }) async {
    final user = _requireUser();
    final userRef = _userDoc(user.uid);
    final eventList = events.toList();
    final eventIds = eventList.map((event) => event.id).toSet();
    final markDates = dateMarks.keys.toSet();

    await userRef.set({
      'email': user.email,
      'displayName': user.displayName,
      'photoUrl': user.photoURL,
      'lastSeenAt': FieldValue.serverTimestamp(),
      'settings': {'autoSyncEnabled': autoSyncEnabled},
    }, SetOptions(merge: true));

    final existingEvents = await userRef.collection('events').get();
    var batch = _firestore.batch();
    var writes = 0;

    Future<void> commitBatchIfNeeded() async {
      if (writes < 450) {
        return;
      }
      await batch.commit();
      batch = _firestore.batch();
      writes = 0;
    }

    for (final doc in existingEvents.docs) {
      if (!eventIds.contains(doc.id)) {
        batch.delete(doc.reference);
        writes++;
        await commitBatchIfNeeded();
      }
    }

    for (final event in eventList) {
      batch.set(userRef.collection('events').doc(event.id), event.toJson());
      writes++;
      await commitBatchIfNeeded();
    }

    final existingMarks = await userRef.collection('dateMarks').get();
    for (final doc in existingMarks.docs) {
      if (!markDates.contains(doc.id)) {
        batch.delete(doc.reference);
        writes++;
        await commitBatchIfNeeded();
      }
    }

    for (final entry in dateMarks.entries) {
      batch.set(userRef.collection('dateMarks').doc(entry.key), {
        'date': entry.key,
        'colorValue': entry.value,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      writes++;
      await commitBatchIfNeeded();
    }

    if (writes > 0) {
      await batch.commit();
    }
  }

  Future<CloudCalendarSnapshot> downloadSnapshot() async {
    final user = _requireUser();
    final userRef = _userDoc(user.uid);
    final eventsSnapshot = await userRef.collection('events').get();
    final marksSnapshot = await userRef.collection('dateMarks').get();
    final userSnapshot = await userRef.get();
    final userData = userSnapshot.data();
    final settings = userData?['settings'];

    return CloudCalendarSnapshot(
      events: [
        for (final doc in eventsSnapshot.docs)
          CloudCalendarEvent.fromJson(doc.id, doc.data()),
      ],
      dateMarks: {
        for (final doc in marksSnapshot.docs)
          if (doc.data()['colorValue'] is int)
            doc.id: doc.data()['colorValue'] as int,
      },
      autoSyncEnabled:
          settings is Map<String, dynamic> &&
          settings['autoSyncEnabled'] == true,
    );
  }

  Future<void> _initializeGoogleSignIn() async {
    if (_googleSignInInitialized) {
      return;
    }

    await _googleSignIn.initialize(
      clientId: Platform.isIOS ? DefaultFirebaseOptions.ios.iosClientId : null,
      serverClientId: DefaultFirebaseOptions.android.androidClientId,
    );
    _googleSignInInitialized = true;
  }

  User _requireUser() {
    final user = _auth.currentUser;
    if (user == null) {
      throw const CloudSyncException('구글 로그인이 필요합니다.');
    }
    return user;
  }

  DocumentReference<Map<String, dynamic>> _userDoc(String uid) {
    return _firestore.collection('users').doc(uid);
  }

  String _maskClientId(String clientId) {
    if (clientId.length <= 18) {
      return clientId;
    }
    return '${clientId.substring(0, 14)}...${clientId.substring(clientId.length - 10)}';
  }
}

class CloudEntitlement {
  const CloudEntitlement({
    required this.plan,
    required this.expiresAt,
    required this.isLifetime,
  });

  factory CloudEntitlement.free() {
    return const CloudEntitlement(
      plan: 'free',
      expiresAt: null,
      isLifetime: false,
    );
  }

  factory CloudEntitlement.fromJson(Map<String, dynamic> json) {
    final expiresAt = json['expiresAt'];
    return CloudEntitlement(
      plan: json['plan'] as String? ?? 'free',
      expiresAt: expiresAt is Timestamp ? expiresAt.toDate() : null,
      isLifetime: json['lifetime'] == true,
    );
  }

  final String plan;
  final DateTime? expiresAt;
  final bool isLifetime;

  bool get isActive {
    if (isLifetime) {
      return true;
    }
    final expiry = expiresAt;
    return expiry != null && expiry.isAfter(DateTime.now());
  }

  String get label {
    if (isLifetime) {
      return '평생 이용권';
    }
    if (expiresAt == null) {
      return '무료 이용 중';
    }
    return '${expiresAt!.year}.${expiresAt!.month.toString().padLeft(2, '0')}.${expiresAt!.day.toString().padLeft(2, '0')}까지';
  }
}

class CloudCalendarSnapshot {
  const CloudCalendarSnapshot({
    required this.events,
    required this.dateMarks,
    required this.autoSyncEnabled,
  });

  final List<CloudCalendarEvent> events;
  final Map<String, int> dateMarks;
  final bool autoSyncEnabled;

  bool get isEmpty => events.isEmpty && dateMarks.isEmpty;
}

class CloudCalendarEvent {
  const CloudCalendarEvent({
    required this.id,
    required this.title,
    required this.startDate,
    required this.priority,
    required this.recurrenceKind,
    required this.adjustmentMode,
    required this.completedDates,
  });

  factory CloudCalendarEvent.fromJson(String id, Map<String, dynamic> json) {
    final completedDates = json['completedDates'];
    return CloudCalendarEvent(
      id: id,
      title: json['title'] as String? ?? '',
      startDate: json['startDate'] as String? ?? '',
      priority: json['priority'] as int? ?? 2,
      recurrenceKind: json['recurrenceKind'] as String? ?? 'none',
      adjustmentMode: json['adjustmentMode'] as String? ?? 'none',
      completedDates: completedDates is List
          ? completedDates.whereType<String>().toSet()
          : <String>{},
    );
  }

  final String id;
  final String title;
  final String startDate;
  final int priority;
  final String recurrenceKind;
  final String adjustmentMode;
  final Set<String> completedDates;

  Map<String, Object?> toJson() {
    return {
      'title': title,
      'startDate': startDate,
      'priority': priority,
      'recurrenceKind': recurrenceKind,
      'adjustmentMode': adjustmentMode,
      'completedDates': completedDates.toList()..sort(),
      'updatedAt': FieldValue.serverTimestamp(),
    };
  }
}

class CloudSyncException implements Exception {
  const CloudSyncException(this.message);

  final String message;

  @override
  String toString() => message;
}
