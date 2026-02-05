import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _userIdKey = 'user_id';
  static const String _userEmailKey = 'user_email';
  static const String _userNameKey = 'user_name';

  // Sign up
  Future<Map<String, dynamic>> signup({
    required String email,
    required String password,
    required String name,
  }) async {
    try {
      final response = await ApiService.post('/api/auth/signup', {
        'email': email,
        'password': password,
        'name': name,
      });

      // Save token and user info
      await _saveAuthData(
        token: response['token'],
        userId: response['user']['id'].toString(),
        email: response['user']['email'],
        name: response['user']['name'],
      );

      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Login
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await ApiService.post('/api/auth/login', {
        'email': email,
        'password': password,
      });

      // Save token and user info
      await _saveAuthData(
        token: response['token'],
        userId: response['user']['id'].toString(),
        email: response['user']['email'],
        name: response['user']['name'],
      );

      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_userEmailKey);
    await prefs.remove(_userNameKey);
  }

  // Get current token
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // Get user info
  Future<Map<String, String?>> getUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'id': prefs.getString(_userIdKey),
      'email': prefs.getString(_userEmailKey),
      'name': prefs.getString(_userNameKey),
    };
  }

  // Get user profile from API
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final token = await getToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await ApiService.get('/api/user/profile', token: token);
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Save auth data to SharedPreferences
  Future<void> _saveAuthData({
    required String token,
    required String userId,
    required String email,
    required String name,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userIdKey, userId);
    await prefs.setString(_userEmailKey, email);
    await prefs.setString(_userNameKey, name);
  }
}
