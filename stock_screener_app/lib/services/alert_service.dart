import 'dart:convert';
import 'package:http/http.dart' as http;
import 'alerts_api_service.dart';
import 'api_config.dart';
import 'auth_service.dart';

/// Wrapper service for alert operations
class AlertService {
  final AlertsApiService _apiService = AlertsApiService();

  /// Get all alerts for user
  Future<List<Map<String, dynamic>>> getAlerts({
    int? userId,
    bool unreadOnly = false,
  }) async {
    try {
      final id = userId ?? AuthService.instance.currentUserId ?? 1;
      return await _apiService.getUserAlerts(id, unreadOnly: unreadOnly);
    } catch (e) {
      print('Error getting alerts: $e');
      return [];
    }
  }

  /// Create a new alert via POST to /api/alerts endpoint
  Future<bool> createAlert({
    required int userId,
    required String symbol,
    required String alertType,
    double? targetPrice,
    double? percentageChange,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/alerts'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'symbol': symbol.toUpperCase(),
          'alertType': alertType,
          'targetPrice': targetPrice,
          'percentageChange': percentageChange,
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Error creating alert: $e');
      return false;
    }
  }

  /// Delete an alert
  Future<bool> deleteAlert(int alertId, {int? userId}) async {
    try {
      final id = userId ?? AuthService.instance.currentUserId ?? 1;
      return await _apiService.deleteAlert(alertId, userId: id);
    } catch (e) {
      print('Error deleting alert: $e');
      return false;
    }
  }

  /// Mark alert as read
  Future<bool> markAsRead(int alertId, {int? userId}) async {
    try {
      final id = userId ?? AuthService.instance.currentUserId ?? 1;
      return await _apiService.markAsRead(alertId, id);
    } catch (e) {
      print('Error marking alert as read: $e');
      return false;
    }
  }

  /// Mark alert as acknowledged
  Future<bool> markAsAcknowledged(int alertId, {int? userId}) async {
    try {
      final id = userId ?? AuthService.instance.currentUserId ?? 1;
      return await _apiService.markAsAcknowledged(alertId, id);
    } catch (e) {
      print('Error acknowledging alert: $e');
      return false;
    }
  }

  /// Get alert statistics
  Future<Map<String, dynamic>> getAlertStats(int userId) async {
    try {
      return await _apiService.getAlertStats(userId);
    } catch (e) {
      print('Error getting alert stats: $e');
      return {};
    }
  }
}
