import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_config.dart';

class AuthUser {
  final int localId;
  final int backendUserId;
  final String name;
  final String email;
  final String passwordHash;
  final String avatarLabel;

  const AuthUser({
    required this.localId,
    required this.backendUserId,
    required this.name,
    required this.email,
    required this.passwordHash,
    required this.avatarLabel,
  });

  Map<String, dynamic> toJson() {
    return {
      'localId': localId,
      'backendUserId': backendUserId,
      'name': name,
      'email': email,
      'passwordHash': passwordHash,
      'avatarLabel': avatarLabel,
    };
  }

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      localId: (json['localId'] as num?)?.toInt() ?? 0,
      backendUserId: (json['backendUserId'] as num?)?.toInt() ?? 1,
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      passwordHash: (json['passwordHash'] ?? '').toString(),
      avatarLabel: (json['avatarLabel'] ?? 'EQ').toString(),
    );
  }
}

class AuthResult {
  final bool success;
  final String message;

  const AuthResult({required this.success, required this.message});
}

class AuthService extends ChangeNotifier {
  AuthService._();

  static final AuthService instance = AuthService._();

  static const _usersKey = 'equiscan_auth_users_v1';
  static const _sessionKey = 'equiscan_auth_session_v1';

  final List<AuthUser> _users = [];
  AuthUser? _currentUser;
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;
  bool get isAuthenticated => _currentUser != null;
  AuthUser? get currentUser => _currentUser;
  int? get currentUserId => _currentUser?.backendUserId;

  static const List<String> avatarOptions = [
    'EQ',
    'AI',
    'TR',
    'MX',
    'QT',
    'IN',
  ];

  Future<void> initialize() async {
    if (_isInitialized) return;

    final prefs = await SharedPreferences.getInstance();
    final usersRaw = prefs.getString(_usersKey);

    if (usersRaw == null || usersRaw.trim().isEmpty) {
      _seedDefaultUser();
      await _persistUsers(prefs);
    } else {
      final parsed = jsonDecode(usersRaw);
      if (parsed is List) {
        _users
          ..clear()
          ..addAll(
            parsed
                .whereType<Map<String, dynamic>>()
                .map(AuthUser.fromJson)
                .where(
                  (u) =>
                      u.email.trim().isNotEmpty &&
                      u.passwordHash.trim().isNotEmpty,
                ),
          );
      }

      if (_users.isEmpty) {
        _seedDefaultUser();
        await _persistUsers(prefs);
      }
    }

    final sessionEmail = prefs.getString(_sessionKey)?.toLowerCase().trim();
    if (sessionEmail != null && sessionEmail.isNotEmpty) {
      _currentUser = _users.where((u) => u.email == sessionEmail).firstOrNull;
    }

    _isInitialized = true;
    notifyListeners();
  }

  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    await initialize();

    final normalizedEmail = email.trim().toLowerCase();
    if (!_isValidEmail(normalizedEmail)) {
      return const AuthResult(
        success: false,
        message: 'Enter a valid email address.',
      );
    }

    if (password.trim().length < 6) {
      return const AuthResult(
        success: false,
        message: 'Password must be at least 6 characters.',
      );
    }

    final hashed = _hashPassword(password);
    final user = _users
        .where((u) => u.email == normalizedEmail && u.passwordHash == hashed)
        .firstOrNull;

    if (user == null) {
      return const AuthResult(
        success: false,
        message: 'Invalid email or password.',
      );
    }

    _currentUser = user;
    await _persistSession();
    notifyListeners();

    return const AuthResult(success: true, message: 'Login successful.');
  }

  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
    required String avatarLabel,
  }) async {
    await initialize();

    final cleanName = name.trim();
    final normalizedEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      return const AuthResult(
        success: false,
        message: 'Name must be at least 2 characters.',
      );
    }

    if (!_isValidEmail(normalizedEmail)) {
      return const AuthResult(
        success: false,
        message: 'Enter a valid email address.',
      );
    }

    if (password.trim().length < 6) {
      return const AuthResult(
        success: false,
        message: 'Password must be at least 6 characters.',
      );
    }

    final exists = _users.any((u) => u.email == normalizedEmail);
    if (exists) {
      return const AuthResult(
        success: false,
        message: 'An account with this email already exists.',
      );
    }

    final backendUserId = await _ensureBackendUser(
      name: cleanName,
      email: normalizedEmail,
    );
    if (backendUserId == null) {
      return const AuthResult(
        success: false,
        message:
            'Unable to create backend user profile. Check backend server and try again.',
      );
    }

    final nextLocalId =
        (_users.map((u) => u.localId).fold<int>(0, (a, b) => a > b ? a : b)) +
        1;
    final selectedAvatar = avatarOptions.contains(avatarLabel)
        ? avatarLabel
        : avatarOptions.first;

    final user = AuthUser(
      localId: nextLocalId,
      backendUserId: backendUserId,
      name: cleanName,
      email: normalizedEmail,
      passwordHash: _hashPassword(password),
      avatarLabel: selectedAvatar,
    );

    _users.add(user);
    _currentUser = user;

    final prefs = await SharedPreferences.getInstance();
    await _persistUsers(prefs);
    await _persistSession();

    notifyListeners();
    return const AuthResult(success: true, message: 'Registration successful.');
  }

  Future<void> logout() async {
    await initialize();
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_sessionKey);
    notifyListeners();
  }

  Future<void> _persistUsers(SharedPreferences prefs) async {
    final payload = jsonEncode(_users.map((u) => u.toJson()).toList());
    await prefs.setString(_usersKey, payload);
  }

  Future<void> _persistSession() async {
    final prefs = await SharedPreferences.getInstance();
    if (_currentUser == null) {
      await prefs.remove(_sessionKey);
      return;
    }
    await prefs.setString(_sessionKey, _currentUser!.email);
  }

  void _seedDefaultUser() {
    _users
      ..clear()
      ..add(
        AuthUser(
          localId: 1,
          backendUserId: 1,
          name: 'Demo Investor',
          email: 'demo@equiscan.app',
          passwordHash: _hashPassword('Demo@123'),
          avatarLabel: 'EQ',
        ),
      );
  }

  String _hashPassword(String value) {
    final bytes = utf8.encode(value.trim());
    return base64Encode(bytes);
  }

  bool _isValidEmail(String value) {
    final expression = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    return expression.hasMatch(value);
  }

  Future<int?> _ensureBackendUser({
    required String name,
    required String email,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/users/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'name': name, 'email': email}),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        return null;
      }

      final body = jsonDecode(response.body);
      if (body is! Map<String, dynamic>) return null;

      final data = body['data'];
      if (data is! Map<String, dynamic>) return null;

      final userIdValue = data['id'];
      if (userIdValue is num) {
        return userIdValue.toInt();
      }

      return int.tryParse('$userIdValue');
    } catch (_) {
      return null;
    }
  }
}

extension _FirstOrNullExtension<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
