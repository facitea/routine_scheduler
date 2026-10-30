import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

class DesktopGoogleOAuth {
  const DesktopGoogleOAuth({required this.clientId, this.clientSecret});

  static const _authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  static const _tokenEndpoint = 'https://oauth2.googleapis.com/token';
  static const _timeout = Duration(minutes: 2);

  final String clientId;
  final String? clientSecret;

  Future<DesktopGoogleOAuthTokens> authenticate() async {
    if (clientId.trim().isEmpty) {
      throw const DesktopGoogleOAuthException(
        'Windows 구글 로그인에는 Google Cloud의 Desktop OAuth Client ID가 필요합니다.',
      );
    }

    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final redirectUri = 'http://127.0.0.1:${server.port}/';
    final state = _randomBase64Url(32);
    final codeVerifier = _randomBase64Url(64);
    final codeChallenge = _codeChallenge(codeVerifier);

    final authUri = Uri.parse(_authEndpoint).replace(
      queryParameters: {
        'client_id': clientId,
        'redirect_uri': redirectUri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state,
        'code_challenge': codeChallenge,
        'code_challenge_method': 'S256',
        'prompt': 'select_account',
      },
    );

    try {
      final launched = await launchUrl(
        authUri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        throw const DesktopGoogleOAuthException('브라우저를 열 수 없습니다.');
      }

      final request = await server.first.timeout(_timeout);
      final query = request.uri.queryParameters;
      await _writeBrowserResponse(request);

      final error = query['error'];
      if (error != null) {
        throw DesktopGoogleOAuthException('구글 로그인이 취소되었거나 실패했습니다: $error');
      }
      if (query['state'] != state) {
        throw const DesktopGoogleOAuthException('로그인 응답 검증에 실패했습니다.');
      }

      final code = query['code'];
      if (code == null || code.isEmpty) {
        throw const DesktopGoogleOAuthException('구글 인증 코드를 받지 못했습니다.');
      }

      return _exchangeCode(
        code: code,
        codeVerifier: codeVerifier,
        redirectUri: redirectUri,
      );
    } on TimeoutException {
      throw const DesktopGoogleOAuthException('구글 로그인 시간이 초과되었습니다.');
    } finally {
      await server.close(force: true);
    }
  }

  Future<DesktopGoogleOAuthTokens> _exchangeCode({
    required String code,
    required String codeVerifier,
    required String redirectUri,
  }) async {
    final client = http.Client();

    try {
      final response = await client.post(
        Uri.parse(_tokenEndpoint),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'code': code,
          'client_id': clientId,
          if (clientSecret != null && clientSecret!.trim().isNotEmpty)
            'client_secret': clientSecret!,
          'code_verifier': codeVerifier,
          'redirect_uri': redirectUri,
          'grant_type': 'authorization_code',
        },
      );

      final data = jsonDecode(utf8.decode(response.bodyBytes));
      if (response.statusCode != 200 || data is! Map<String, dynamic>) {
        final message = data is Map<String, dynamic>
            ? data['error_description'] ?? data['error'] ?? response.body
            : response.body;
        throw DesktopGoogleOAuthException('구글 토큰 교환 실패: $message');
      }

      final idToken = data['id_token'];
      final accessToken = data['access_token'];
      if (idToken is! String || accessToken is! String) {
        throw const DesktopGoogleOAuthException('구글 토큰 응답이 올바르지 않습니다.');
      }

      return DesktopGoogleOAuthTokens(
        idToken: idToken,
        accessToken: accessToken,
      );
    } finally {
      client.close();
    }
  }

  Future<void> _writeBrowserResponse(HttpRequest request) async {
    request.response
      ..statusCode = HttpStatus.ok
      ..headers.contentType = ContentType.html
      ..write('''
<!doctype html>
<html lang="ko">
  <head><meta charset="utf-8"><title>Routine Scheduler</title></head>
  <body style="font-family:sans-serif;padding:24px;">
    <h2>로그인이 완료되었습니다.</h2>
    <p>브라우저를 닫고 Routine Scheduler로 돌아가세요.</p>
  </body>
</html>
''');
    await request.response.close();
  }

  String _codeChallenge(String verifier) {
    final digest = sha256.convert(ascii.encode(verifier));
    return base64Url.encode(digest.bytes).replaceAll('=', '');
  }

  String _randomBase64Url(int byteCount) {
    final random = Random.secure();
    final bytes = List<int>.generate(byteCount, (_) => random.nextInt(256));
    return base64Url.encode(bytes).replaceAll('=', '');
  }
}

class DesktopGoogleOAuthTokens {
  const DesktopGoogleOAuthTokens({
    required this.idToken,
    required this.accessToken,
  });

  final String idToken;
  final String accessToken;
}

class DesktopGoogleOAuthException implements Exception {
  const DesktopGoogleOAuthException(this.message);

  final String message;

  @override
  String toString() => message;
}
