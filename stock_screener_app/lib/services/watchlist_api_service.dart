import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;

class WatchlistApiService {
  // Use environment variable if provided, otherwise use phone hotspot IP
  // Run with: flutter run --dart-define=API_BASE_URL=http://10.39.159.30:5000
  static String get _apiBaseUrl {
    const env = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (env.isNotEmpty) return env;
    // Fallback to phone hotspot IP
    return 'http://10.39.159.30:5000';
  }

  String get baseUrl => '$_apiBaseUrl/api/watchlist';

  /// Get user's watchlist with full stock details
  Future<List<Map<String, dynamic>>> getWatchlist(int userId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/$userId'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final List<dynamic> watchlist = data['data']['watchlist'] ?? [];
          return watchlist.cast<Map<String, dynamic>>();
        }
        return [];
      } else {
        throw Exception('Failed to fetch watchlist: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error fetching watchlist: $e');
      throw Exception('Error fetching watchlist: $e');
    }
  }

  /// Add stock to watchlist
  Future<bool> addToWatchlist(int userId, String symbol) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/add'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'symbol': symbol.toUpperCase(),
        }),
      );

      if (response.statusCode == 201) {
        print('✅ Added $symbol to watchlist');
        return true;
      } else if (response.statusCode == 409) {
        print('⚠️ $symbol already in watchlist');
        return false;
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Failed to add to watchlist');
      }
    } catch (e) {
      print('❌ Error adding to watchlist: $e');
      throw Exception('Error adding to watchlist: $e');
    }
  }

  /// Remove stock from watchlist
  Future<bool> removeFromWatchlist(int userId, String symbol) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/remove'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'symbol': symbol.toUpperCase(),
        }),
      );

      if (response.statusCode == 200) {
        print('✅ Removed $symbol from watchlist');
        return true;
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Failed to remove from watchlist');
      }
    } catch (e) {
      print('❌ Error removing from watchlist: $e');
      throw Exception('Error removing from watchlist: $e');
    }
  }

  /// Check if symbol is in watchlist
  Future<bool> isInWatchlist(int userId, String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/$userId/check/${symbol.toUpperCase()}'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data']['is_in_watchlist'] == true;
      }
      return false;
    } catch (e) {
      print('❌ Error checking watchlist status: $e');
      return false;
    }
  }

  /// Toggle watchlist status
  Future<bool> toggleWatchlist(int userId, String symbol) async {
    final isWatched = await isInWatchlist(userId, symbol);
    
    if (isWatched) {
      await removeFromWatchlist(userId, symbol);
      return false;
    } else {
      await addToWatchlist(userId, symbol);
      return true;
    }
  }
}
