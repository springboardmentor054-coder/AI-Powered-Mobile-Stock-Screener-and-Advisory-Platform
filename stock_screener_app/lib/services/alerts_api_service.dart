import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;

class AlertsApiService {
  // Use platform-specific base URL
  static String get _apiBaseUrl {
    if (defaultTargetPlatform == TargetPlatform.windows) {
      return 'http://localhost:5000';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000';
    }
    if (kIsWeb) return 'http://localhost:5000';
    return 'http://localhost:5000';
  }

  String get baseUrl => '$_apiBaseUrl/api/alerts';

  /// Get user's alerts
  Future<List<Map<String, dynamic>>> getUserAlerts(int userId, {bool unreadOnly = false}) async {
    try {
      final url = Uri.parse('$baseUrl/$userId${unreadOnly ? '?unreadOnly=true' : ''}');
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final List<dynamic> alerts = data['data']['alerts'] ?? [];
          return alerts.cast<Map<String, dynamic>>();
        }
        return [];
      } else {
        throw Exception('Failed to fetch alerts: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error fetching alerts: $e');
      throw Exception('Error fetching alerts: $e');
    }
  }

  /// Get alert statistics
  Future<Map<String, dynamic>> getAlertStats(int userId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/$userId/stats'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return Map<String, dynamic>.from(data['data']);
        }
        return {
          'total_alerts': 0,
          'unread_alerts': 0,
          'by_severity': {'low': 0, 'medium': 0, 'high': 0, 'critical': 0},
          'by_type': {},
        };
      } else {
        throw Exception('Failed to fetch alert stats');
      }
    } catch (e) {
      print('❌ Error fetching alert stats: $e');
      return {
        'total_alerts': 0,
        'unread_alerts': 0,
        'by_severity': {'low': 0, 'medium': 0, 'high': 0, 'critical': 0},
        'by_type': {},
      };
    }
  }

  /// Mark alert as read
  Future<bool> markAsRead(int alertId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/$alertId/read'),
        headers: {'Content-Type': 'application/json'},
      );

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error marking alert as read: $e');
      return false;
    }
  }

  /// Mark alert as acknowledged
  Future<bool> markAsAcknowledged(int alertId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/$alertId/acknowledge'),
        headers: {'Content-Type': 'application/json'},
      );

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error acknowledging alert: $e');
      return false;
    }
  }

  /// Mark all alerts as read for a user
  Future<bool> markAllAsRead(int userId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/$userId/read-all'),
        headers: {'Content-Type': 'application/json'},
      );

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error marking all alerts as read: $e');
      return false;
    }
  }

  /// Dismiss (soft delete) an alert
  Future<bool> dismissAlert(int alertId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/$alertId/dismiss'),
        headers: {'Content-Type': 'application/json'},
      );

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error dismissing alert: $e');
      return false;
    }
  }

  /// Delete an alert permanently
  Future<bool> deleteAlert(int alertId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/$alertId'),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error deleting alert: $e');
      return false;
    }
  }

  /// Clear all dismissed alerts
  Future<bool> clearDismissed(int userId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/$userId/dismissed'),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error clearing dismissed alerts: $e');
      return false;
    }
  }
}
