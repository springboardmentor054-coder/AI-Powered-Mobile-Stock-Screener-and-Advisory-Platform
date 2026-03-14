import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';
import '../config/api_config.dart';

class AlertService {
  static String get baseUrl => '${ApiConfig.baseUrl}/api/alerts';
  final AuthService _authService = AuthService();

  // Get all alerts
  Future<List<Map<String, dynamic>>> getAlerts({
    int limit = 200,
    int offset = 0,
    bool unreadOnly = false,
  }) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final queryParams = {
        'limit': limit.toString(),
        'offset': offset.toString(),
        'unreadOnly': unreadOnly.toString(),
      };

      final uri = Uri.parse(baseUrl).replace(queryParameters: queryParams);

      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final alerts = List<Map<String, dynamic>>.from(data['data'] ?? []);
        
        // Convert string numbers to actual numbers
        return alerts.map((alert) {
          final Map<String, dynamic> converted = Map<String, dynamic>.from(alert);
          converted['old_value'] = _parseNumber(alert['old_value']);
          converted['new_value'] = _parseNumber(alert['new_value']);
          converted['change_percentage'] = _parseNumber(alert['change_percentage']);
          return converted;
        }).toList();
      } else {
        throw Exception('Failed to fetch alerts: ${response.body}');
      }
    } catch (e) {
      print('Error fetching alerts: $e');
      rethrow;
    }
  }

  // Get unread alerts count
  Future<int> getUnreadCount() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        return 0;
      }

      final response = await http.get(
        Uri.parse('$baseUrl/unread-count'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['unreadCount'] ?? 0;
      }
      return 0;
    } catch (e) {
      print('Error fetching unread count: $e');
      return 0;
    }
  }

  // Mark alert as read
  Future<bool> markAsRead(int alertId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await http.put(
        Uri.parse('$baseUrl/$alertId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error marking alert as read: $e');
      return false;
    }
  }

  // Mark all alerts as read
  Future<bool> markAllAsRead() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await http.put(
        Uri.parse('$baseUrl/mark-all-read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error marking all alerts as read: $e');
      return false;
    }
  }

  // Delete alert
  Future<bool> deleteAlert(int alertId) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await http.delete(
        Uri.parse('$baseUrl/$alertId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting alert: $e');
      return false;
    }
  }

  // Delete all alerts
  Future<bool> deleteAllAlerts() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await http.delete(
        Uri.parse(baseUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting all alerts: $e');
      return false;
    }
  }

  // Generate alerts manually
  Future<bool> generateAlerts() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await http.post(
        Uri.parse('$baseUrl/generate'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error generating alerts: $e');
      return false;
    }
  }

  // Create test alert
  Future<bool> createTestAlert({String symbol = 'AAPL'}) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      final response = await http.post(
        Uri.parse('$baseUrl/test'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({'symbol': symbol}),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error creating test alert: $e');
      return false;
    }
  }

  // Helper method to parse string or number to num
  num? _parseNumber(dynamic value) {
    if (value == null) return null;
    if (value is num) return value;
    if (value is String) {
      return num.tryParse(value);
    }
    return null;
  }
}
