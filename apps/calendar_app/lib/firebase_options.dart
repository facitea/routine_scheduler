import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb;

class DefaultFirebaseOptions {
  static const windowsDesktopOAuthClientId = String.fromEnvironment(
    'WINDOWS_GOOGLE_OAUTH_CLIENT_ID',
    defaultValue: '',
  );
  static const windowsDesktopOAuthClientSecret = String.fromEnvironment(
    'WINDOWS_GOOGLE_OAUTH_CLIENT_SECRET',
    defaultValue: '',
  );

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }

    return switch (defaultTargetPlatform) {
      TargetPlatform.android => android,
      TargetPlatform.iOS => ios,
      TargetPlatform.windows => windows,
      _ => throw UnsupportedError(
        'Firebase options are not configured for this platform.',
      ),
    };
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCNBD2pCGoO5QHSJdt2Uvy1x-aP3RQx2yo',
    authDomain: 'routine-scheduler-bcf6a.firebaseapp.com',
    projectId: 'routine-scheduler-bcf6a',
    storageBucket: 'routine-scheduler-bcf6a.firebasestorage.app',
    messagingSenderId: '42652881832',
    appId: '1:42652881832:web:2a37b23e103b30d0f3c39d',
    measurementId: 'G-8CRZ2ZL48V',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBuSJXuvuxOl8BllcBX7kNgkk1cojlT5AY',
    appId: '1:42652881832:android:7448ff871fda63b5f3c39d',
    messagingSenderId: '42652881832',
    projectId: 'routine-scheduler-bcf6a',
    storageBucket: 'routine-scheduler-bcf6a.firebasestorage.app',
    androidClientId: String.fromEnvironment('ANDROID_GOOGLE_OAUTH_CLIENT_ID'),
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCOHsYhvOQcpeZc8N8wlw91ZxYgnCOMRPE',
    appId: '1:42652881832:ios:1a98d3db7a4500a2f3c39d',
    messagingSenderId: '42652881832',
    projectId: 'routine-scheduler-bcf6a',
    storageBucket: 'routine-scheduler-bcf6a.firebasestorage.app',
    iosBundleId: 'com.advancedcalendar.calendarApp',
    iosClientId: String.fromEnvironment('IOS_GOOGLE_OAUTH_CLIENT_ID'),
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyCNBD2pCGoO5QHSJdt2Uvy1x-aP3RQx2yo',
    authDomain: 'routine-scheduler-bcf6a.firebaseapp.com',
    projectId: 'routine-scheduler-bcf6a',
    storageBucket: 'routine-scheduler-bcf6a.firebasestorage.app',
    messagingSenderId: '42652881832',
    appId: '1:42652881832:web:2a37b23e103b30d0f3c39d',
    measurementId: 'G-8CRZ2ZL48V',
  );
}
