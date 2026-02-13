import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';

class AlertsApiService {
  String get baseUrl => '${ApiConfig.baseUrl}/api/alerts';

  /// Get user's alerts.
  Future<List<Map<String, dynamic>>> getUserAlerts(
    int userId, {
    bool unreadOnly = false,
  }) async {
    try {
      final url = Uri.parse(
        '$baseUrl/$userId${unreadOnly ? '?unreadOnly=true' : ''}',
      );
      final response = await http.get(url);

      if (response.statusCode != 200) {
        throw Exception('Failed to fetch alerts: ${response.statusCode}');
      }

      final body = json.decode(response.body);
      List<dynamic> rawAlerts = [];

      if (body is List) {
        rawAlerts = body;
      } else if (body is Map<String, dynamic> && body['data'] != null) {
        final data = body['data'];
        if (data is List) {
          rawAlerts = data;
        } else if (data is Map<String, dynamic> && data['alerts'] is List) {
          rawAlerts = data['alerts'] as List<dynamic>;
        }
      }

      return rawAlerts
          .whereType<Map<String, dynamic>>()
          .map(_normalizeAlert)
          .toList();
    } catch (e) {
      print('Error fetching alerts: $e');
      throw Exception('Error fetching alerts: $e');
    }
  }

  /// Get alert statistics.
  Future<Map<String, dynamic>> getAlertStats(int userId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/$userId/stats'));

      if (response.statusCode != 200) {
        throw Exception('Failed to fetch alert stats: ${response.statusCode}');
      }

      final body = json.decode(response.body);
      if (body is Map<String, dynamic> &&
          body['data'] is Map<String, dynamic>) {
        return Map<String, dynamic>.from(body['data'] as Map<String, dynamic>);
      }

      return _defaultStats();
    } catch (e) {
      print('Error fetching alert stats: $e');
      return _defaultStats();
    }
  }

  /// Mark alert as read.
  Future<bool> markAsRead(int alertId, int userId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/$alertId/read'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId}),
      );

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error marking alert as read: $e');
      return false;
    }
  }

  /// Mark alert as acknowledged.
  Future<bool> markAsAcknowledged(int alertId, int userId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/$alertId/acknowledge'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId}),
      );

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error acknowledging alert: $e');
      return false;
    }
  }

  /// Mark all alerts as read for a user.
  Future<bool> markAllAsRead(int userId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/$userId/read-all'),
        headers: {'Content-Type': 'application/json'},
      );

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error marking all alerts as read: $e');
      return false;
    }
  }

  /// Delete an alert permanently.
  Future<bool> deleteAlert(int alertId, {int? userId}) async {
    try {
      final uri = userId != null
          ? Uri.parse('$baseUrl/$alertId?userId=$userId')
          : Uri.parse('$baseUrl/$alertId');
      final response = await http.delete(uri);

      if (response.statusCode == 200 || response.statusCode == 204) {
        return true;
      }

      // Compatibility fallback.
      if (userId != null) {
        return dismissAlert(alertId, userId: userId);
      }

      return false;
    } catch (e) {
      print('Error deleting alert: $e');
      return false;
    }
  }

  /// Clear all dismissed alerts.
  Future<bool> clearDismissed(int userId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/$userId/dismissed'),
      );

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error clearing dismissed alerts: $e');
      return false;
    }
  }

  Future<bool> dismissAlert(int alertId, {required int userId}) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/$alertId/dismiss'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId}),
      );

      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error dismissing alert: $e');
      return false;
    }
  }

  Map<String, dynamic> _normalizeAlert(Map<String, dynamic> alert) {
    final isRead =
        alert['isRead'] == true ||
        alert['is_read'] == true ||
        alert['read'] == true ||
        alert['is_read'] == 1;

    return {
      ...alert,
      'id': alert['id'],
      'symbol': alert['symbol']?.toString() ?? 'NA',
      'severity': (alert['severity']?.toString() ?? 'medium').toLowerCase(),
      'title': alert['title']?.toString() ?? 'Alert',
      'message':
          alert['message']?.toString() ??
          alert['description']?.toString() ??
          '',
      'description':
          alert['description']?.toString() ??
          alert['message']?.toString() ??
          '',
      'isRead': isRead,
      'is_read': isRead,
      'read': isRead,
      'createdAt':
          alert['createdAt']?.toString() ??
          alert['created_at']?.toString() ??
          alert['triggered_at']?.toString(),
      'created_at':
          alert['created_at']?.toString() ??
          alert['createdAt']?.toString() ??
          alert['triggered_at']?.toString(),
    };
  }

  Map<String, dynamic> _defaultStats() {
    return {
      'total_alerts': 0,
      'unread_alerts': 0,
      'by_severity': {'low': 0, 'medium': 0, 'high': 0, 'critical': 0},
      'by_type': <String, dynamic>{},
    };
  }
}
