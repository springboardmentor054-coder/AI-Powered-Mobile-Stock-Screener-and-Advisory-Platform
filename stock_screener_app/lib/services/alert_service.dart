import 'dart:convert';
import 'package:http/http.dart' as http;

class AlertService {
  // Use environment variable if provided, otherwise use phone hotspot IP
  // Run with: flutter run --dart-define=API_BASE_URL=http://10.39.159.30:5000
  static String get _apiBaseUrl {
    const env = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (env.isNotEmpty) return env;
    // Fallback to phone hotspot IP
    return 'http://10.39.159.30:5000';
  }
  
  String get baseUrl => '$_apiBaseUrl/api/alerts';

  /// Create a new price alert
  Future<bool> createAlert({
    required int userId,
    required String symbol,
    required String alertType, // 'price_above', 'price_below'
    required double targetPrice,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/create'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'symbol': symbol,
          'alertType': alertType,
          'targetPrice': targetPrice,
          'isActive': true,
        }),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Alert created: ${data['message']}');
        return true;
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to create alert');
      }
    } catch (e) {
      print('❌ Error creating alert: $e');
      throw Exception('Error creating alert: $e');
    }
  }

  /// Get user's alerts
  Future<List<Map<String, dynamic>>> getAlerts(int userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/$userId'),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final alerts = data['data'] as List<dynamic>? ?? [];
        return alerts.cast<Map<String, dynamic>>();
      } else {
        throw Exception('Failed to fetch alerts: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error fetching alerts: $e');
      return [];
    }
  }

  /// Update alert status
  Future<bool> updateAlert(int alertId, bool isActive) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/$alertId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'isActive': isActive}),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        print('✅ Alert updated');
        return true;
      } else {
        throw Exception('Failed to update alert');
      }
    } catch (e) {
      print('❌ Error updating alert: $e');
      throw Exception('Error updating alert: $e');
    }
  }

  /// Delete alert
  Future<bool> deleteAlert(int alertId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/$alertId'),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        print('✅ Alert deleted');
        return true;
      } else {
        throw Exception('Failed to delete alert');
      }
    } catch (e) {
      print('❌ Error deleting alert: $e');
      throw Exception('Error deleting alert: $e');
    }
  }

  /// Get alert statistics
  Future<Map<String, dynamic>> getAlertStats(int userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/$userId/stats'),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {
          'total': 0,
          'active': 0,
          'triggered': 0,
        };
      }
    } catch (e) {
      print('❌ Error fetching alert stats: $e');
      return {
        'total': 0,
        'active': 0,
        'triggered': 0,
      };
    }
  }
}
