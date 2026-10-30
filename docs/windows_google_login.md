# Windows Google Login

Windows desktop Google login uses Google's installed app OAuth flow with a
loopback redirect. The mobile `google_sign_in` flow does not support Windows.

## Firebase / Google Cloud setup

1. Open Google Cloud Console for the Firebase project.
2. Go to APIs & Services > Credentials.
3. Create credentials > OAuth client ID.
4. Choose Application type: Desktop app.
5. Name it `Routine Scheduler Windows`.
6. Copy the generated Client ID. Keep OAuth credentials outside Git.

## Run or build

Pass the desktop OAuth Client ID and, only when required by the configured
client, its secret as Dart defines:

```powershell
flutter run -d windows `
  --dart-define=WINDOWS_GOOGLE_OAUTH_CLIENT_ID=YOUR_DESKTOP_CLIENT_ID `
  --dart-define=WINDOWS_GOOGLE_OAUTH_CLIENT_SECRET=YOUR_DESKTOP_CLIENT_SECRET
```

For a debug build:

```powershell
flutter build windows --debug `
  --dart-define=WINDOWS_GOOGLE_OAUTH_CLIENT_ID=YOUR_DESKTOP_CLIENT_ID `
  --dart-define=WINDOWS_GOOGLE_OAUTH_CLIENT_SECRET=YOUR_DESKTOP_CLIENT_SECRET
```

For release packaging, use the same define with `flutter build windows`.

For Android and iOS, create Firebase app configuration files for your project:

- `apps/calendar_app/android/app/google-services.json`
- `apps/calendar_app/ios/Runner/GoogleService-Info.plist`

These credential-bearing files are intentionally ignored by Git.
