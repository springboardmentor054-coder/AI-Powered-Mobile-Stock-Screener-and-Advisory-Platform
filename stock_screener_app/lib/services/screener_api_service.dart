import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:http/http.dart' as http;
import '../models/saved_screener.dart';

class ScreenerApiService {
  // Use platform-specific base URL (same logic as ApiService)
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

  String get baseUrl => '$_apiBaseUrl/api/screeners';

  /// Save a new screener
  Future<SavedScreener> saveScreener({
    required int userId,
    required String name,
    required Map<String, dynamic> dslQuery,
    bool notificationEnabled = true,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/$userId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'dslQuery': dslQuery,
          'notificationEnabled': notificationEnabled,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        return SavedScreener.fromJson(data);
      } else if (response.statusCode == 400) {
        final error = json.decode(response.body);
        throw Exception('Invalid input: ${error['errors']?[0]?['msg'] ?? 'Unknown error'}');
      } else {
        throw Exception('Failed to save screener: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error saving screener: $e');
    }
  }

  /// Get all screeners for a user
  Future<List<SavedScreener>> getUserScreeners(int userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/$userId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        // Handle wrapped response: {success: true, data: {screeners: [...]}}
        if (responseData is Map<String, dynamic>) {
          final data = responseData['data'];
          if (data is Map<String, dynamic> && data['screeners'] is List) {
            final List<dynamic> screeners = data['screeners'];
            return screeners.map((json) => SavedScreener.fromJson(json)).toList();
          }
        }
        // Fallback for direct array response
        if (responseData is List) {
          return responseData.map((json) => SavedScreener.fromJson(json)).toList();
        }
        throw Exception('Unexpected response format');
      } else {
        throw Exception('Failed to load screeners: ${response.statusCode}');
      }
    } catch (e) {
      print('🔴 Error fetching screeners: $e');
      throw Exception('Error fetching screeners: $e');
    }
  }

  /// Get user statistics
  Future<ScreenerStats> getUserStats(int userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/$userId/stats'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        // Handle wrapped response: {success: true, data: {...}}
        if (responseData is Map<String, dynamic> && responseData['data'] != null) {
          return ScreenerStats.fromJson(responseData['data']);
        }
        return ScreenerStats.fromJson(responseData);
      } else {
        throw Exception('Failed to load stats: ${response.statusCode}');
      }
    } catch (e) {
      print('🔴 Error fetching stats: $e');
      throw Exception('Error fetching stats: $e');
    }
  }

  /// Get a specific screener
  Future<SavedScreener> getScreenerById({
    required int userId,
    required int screenerId,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/$userId/$screenerId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        // Handle wrapped response: {success: true, data: {...}}
        if (responseData is Map<String, dynamic> && responseData['data'] != null) {
          return SavedScreener.fromJson(responseData['data']);
        }
        return SavedScreener.fromJson(responseData);
      } else if (response.statusCode == 404) {
        throw Exception('Screener not found');
      } else {
        throw Exception('Failed to load screener: ${response.statusCode}');
      }
    } catch (e) {
      print('🔴 Error fetching screener: $e');
      throw Exception('Error fetching screener: $e');
    }
  }

  /// Update a screener
  Future<SavedScreener> updateScreener({
    required int userId,
    required int screenerId,
    String? name,
    Map<String, dynamic>? dslQuery,
    bool? notificationEnabled,
    bool? active,
  }) async {
    try {
      final updates = <String, dynamic>{};
      if (name != null) updates['name'] = name;
      if (dslQuery != null) updates['dslQuery'] = dslQuery;
      if (notificationEnabled != null) updates['notificationEnabled'] = notificationEnabled;
      if (active != null) updates['active'] = active;

      final response = await http.patch(
        Uri.parse('$baseUrl/$userId/$screenerId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(updates),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return SavedScreener.fromJson(data);
      } else if (response.statusCode == 404) {
        throw Exception('Screener not found');
      } else {
        throw Exception('Failed to update screener: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error updating screener: $e');
    }
  }

  /// Delete a screener
  Future<void> deleteScreener({
    required int userId,
    required int screenerId,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/$userId/$screenerId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        if (response.statusCode == 404) {
          throw Exception('Screener not found');
        } else {
          throw Exception('Failed to delete screener: ${response.statusCode}');
        }
      }
    } catch (e) {
      throw Exception('Error deleting screener: $e');
    }
  }

  /// Toggle notifications for a screener
  Future<void> toggleNotifications({
    required int userId,
    required int screenerId,
    required bool enabled,
  }) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/$userId/$screenerId/notifications'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'enabled': enabled}),
      );

      if (response.statusCode != 200) {
        if (response.statusCode == 404) {
          throw Exception('Screener not found');
        } else {
          throw Exception('Failed to toggle notifications: ${response.statusCode}');
        }
      }
    } catch (e) {
      throw Exception('Error toggling notifications: $e');
    }
  }
}
