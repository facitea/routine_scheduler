# 개발 환경 설정

이 PC에는 Flutter 개발 도구를 `C:\dev\tools` 아래에 설치했습니다.

## 설치 위치

| 도구 | 위치 |
| --- | --- |
| Flutter SDK | `C:\dev\tools\flutter` |
| Dart SDK | `C:\dev\tools\flutter\bin\cache\dart-sdk` |
| Git for Windows Portable | `C:\dev\tools\PortableGit` |
| JDK 17 | `C:\dev\tools\jdk-17.0.19+10` |
| Android SDK | `C:\dev\tools\android-sdk` |
| Visual Studio Build Tools | `C:\dev\tools\VSBuildTools` |

## 사용자 환경변수

다음 사용자 환경변수를 설정했습니다.

```text
JAVA_HOME=C:\dev\tools\jdk-17.0.19+10
ANDROID_HOME=C:\dev\tools\android-sdk
ANDROID_SDK_ROOT=C:\dev\tools\android-sdk
TEMP=C:\dev\tmp
TMP=C:\dev\tmp
PUB_CACHE=C:\dev\pub-cache
```

사용자 `Path`에는 다음 경로를 추가했습니다.

```text
C:\dev\tools\PortableGit\cmd
C:\dev\tools\flutter\bin
C:\dev\tools\jdk-17.0.19+10\bin
C:\dev\tools\android-sdk\cmdline-tools\latest\bin
C:\dev\tools\android-sdk\platform-tools
```

`PUB_CACHE`는 Android native 패키지 빌드 중 한글 사용자 경로에서 CMake가 실패하는 문제를 피하기 위해 ASCII 경로로 지정했습니다.

이미 열려 있던 터미널이나 IDE는 환경변수를 다시 읽지 못할 수 있으므로 새로 열어야 합니다.

## 검증 결과

확인한 항목:

```powershell
flutter doctor -v
dart test
flutter analyze
flutter test
flutter build windows --debug
flutter build apk --debug
```

`flutter doctor -v`는 모든 항목이 통과했고 `No issues found!`를 반환했습니다.

## 빌드 산출물

Windows debug 빌드:

```text
apps\calendar_app\build\windows\x64\runner\Debug\calendar_app.exe
```

Android debug APK:

```text
apps\calendar_app\build\app\outputs\flutter-apk\app-debug.apk
```

## iOS

iOS 프로젝트 폴더는 생성되어 있지만, iOS 빌드와 배포는 Windows에서 직접 할 수 없습니다. 실제 iOS 빌드에는 macOS, Xcode, Apple Developer 설정이 필요합니다.
