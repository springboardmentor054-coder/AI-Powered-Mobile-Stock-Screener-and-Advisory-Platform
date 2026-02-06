import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;
import 'package:http/http.dart' as http;
import '../widgets/rate_limit_handler.dart';

class ApiService {
  // Base URL for the backend API
  // Priority: Environment variable > Platform defaults
  static String get baseUrl {
    const env = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (env.isNotEmpty) return env;
    
    // For Windows/Desktop - Use localhost
    if (defaultTargetPlatform == TargetPlatform.windows) {
      return 'http://localhost:5000';
    }
    
    // For Android Emulator - Use special emulator IP
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000';
    }
    
    // For Web
    if (kIsWeb) return 'http://localhost:5000';
    
    // Default fallback
    return 'http://localhost:5000';
  }

  static const Duration defaultTimeout = Duration(seconds: 60);
  static const Duration healthTimeout = Duration(seconds: 5);

  /// Fetches stocks based on natural language query
  ///
  /// Example query: "Show IT stocks with PE below 5"
  /// Returns a list of stocks matching the criteria
  Future<List<dynamic>> fetchStocks(String query) async {
    try {
      print('Sending query to API: $query');

      final response = await http
          .post(
            Uri.parse('$baseUrl/screener'),
            headers: {
              'Content-Type': 'application/json',
            },
            body: jsonEncode({
              'query': query,
            }),
          )
          .timeout(
            defaultTimeout,
            onTimeout: () {
              throw TimeoutException(
                'Request timeout - server took too long to respond',
                defaultTimeout,
              );
            },
          );

      print('Response status: ${response.statusCode}');

      // Handle rate limiting
      if (response.statusCode == 429) {
        throw RateLimitError(
          statusCode: 429,
          message: 'API rate limit exceeded - please wait before retrying',
          retryAfterSeconds: 30,
        );
      }

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);

        // Check if success field exists and is true
        if (jsonData['success'] != true) {
          throw Exception('Server returned error: ${jsonData['error'] ?? 'Unknown error'}');
        }

        final data = jsonData['data'] as List<dynamic>;
        final cached = jsonData['cached'] ?? false;
        print('Success: Received ${data.length} stocks ${cached ? '(from cache)' : ''}');

        return data;
      } else if (response.statusCode == 400) {
        final error = jsonDecode(response.body);
        throw Exception('Invalid query: ${error['error'] ?? 'Bad request'}');
      } else {
        throw handleResponseError(response.statusCode, response.body);
      }
    } catch (e) {
      print('Error fetching stocks: $e');
      rethrow;
    }
  }

  /// Get user's portfolio
  Future<Map<String, dynamic>?> getPortfolio(int userId) async {
    try {
      final response = await http
          .get(
            Uri.parse('$baseUrl/api/portfolio/$userId'),
          )
          .timeout(defaultTimeout);

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Error fetching portfolio: $e');
      return null;
    }
  }

  /// Add stock to portfolio
  Future<Map<String, dynamic>?> addToPortfolio({
    required int userId,
    required String symbol,
    required double quantity,
    required double avgPrice,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/portfolio/add'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'symbol': symbol,
          'quantity': quantity,
          'avgPrice': avgPrice,
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Error adding to portfolio: $e');
      return null;
    }
  }

  /// Get user's alerts
  Future<List<dynamic>> getAlerts(int userId, {bool unreadOnly = false}) async {
    try {
      final url = '$baseUrl/api/alerts/$userId${unreadOnly ? '?unreadOnly=true' : ''}';
      final response = await http.get(Uri.parse(url)).timeout(defaultTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Handle both array response and object with data field
        if (data is List) {
          return data;
        } else if (data is Map && data['data'] != null) {
          if (data['data'] is List) {
            return data['data'] as List<dynamic>;
          } else if (data['data'] is Map && data['data']['alerts'] != null) {
            return data['data']['alerts'] as List<dynamic>;
          }
        }
        return [];
      }
      return [];
    } catch (e) {
      print('Error fetching alerts: $e');
      return [];
    }
  }

  /// Get saved screeners for user
  Future<List<dynamic>> getSavedScreeners(int userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/screeners/saved/$userId'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Error fetching saved screeners: $e');
      return [];
    }
  }

  /// Get alert statistics
  Future<Map<String, dynamic>?> getAlertStats(int userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/alerts/$userId/stats'),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Error fetching alert stats: $e');
      return null;
    }
  }

  /// Mark alert as read
  Future<bool> markAlertAsRead(int alertId, int userId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/api/alerts/$alertId/read'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': userId}),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error marking alert as read: $e');
      return false;
    }
  }

  /// Get system status
  Future<Map<String, dynamic>?> getSystemStatus() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/admin/status'),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Error fetching system status: $e');
      return null;
    }
  }

  /// Get real-time stock data from Yahoo Finance
  Future<Map<String, dynamic>?> getRealtimeStockData(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/market/realtime/$symbol'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      print('Error fetching real-time data: $e');
      return null;
    }
  }

  /// Get real-time data for multiple stocks
  Future<List<dynamic>?> getBulkRealtimeData(List<String> symbols) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/market/realtime/bulk'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'symbols': symbols}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      print('Error fetching bulk real-time data: $e');
      return null;
    }
  }

  /// Get intraday chart data
  Future<Map<String, dynamic>?> getIntradayData(String symbol) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/market/intraday/$symbol'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'];
      }
      return null;
    } catch (e) {
      print('Error fetching intraday data: $e');
      return null;
    }
  }

  /// Checks if the backend server is running
  Future<bool> checkHealth() async {
    try {
      print('🔍 Checking backend health at: $baseUrl/health');
      final response = await http
          .get(
            Uri.parse('$baseUrl/health'),
          )
          .timeout(healthTimeout);
      print('✅ Backend health check: ${response.statusCode}');
      return response.statusCode == 200;    } on TimeoutException catch (e) {
      print('⏱️ Health check timeout: $e');
      return false;    } catch (e) {
      print('Health check failed: $e');
      return false;
    }
  }

  /// Get all stocks (simple list)
  Future<List<dynamic>> getAllStocks() async {
    try {
      final response = await http
          .get(
            Uri.parse('$baseUrl/stocks'),
          )
          .timeout(defaultTimeout);

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        
        // Backend returns: { success: true, data: [...], count: N }
        // Extract the 'data' array
        if (jsonData is Map<String, dynamic> && jsonData['data'] is List) {
          return jsonData['data'] as List<dynamic>;
        }
        
        // Fallback: if response is already a list
        if (jsonData is List) {
          return jsonData;
        }
        
        return [];
      }
      return [];
    } catch (e) {
      print('Error fetching all stocks: $e');
      return [];
    }
  }

  /// Get dashboard summary data
  Future<Map<String, dynamic>> getDashboardData() async {
    try {
      // Get all stocks first
      final stocks = await getAllStocks();

      if (stocks.isEmpty) {
        return {
          'trending': [],
          'topGainers': [],
          'topLosers': [],
          'totalStocks': 0,
        };
      }

      // Sort and categorize
      final List<dynamic> sortedByVolume = List.from(stocks);
      sortedByVolume.sort((a, b) {
        double toDouble(dynamic value) {
          if (value == null) return 0.0;
          if (value is num) return value.toDouble();
          if (value is String) return double.tryParse(value) ?? 0.0;
          return 0.0;
        }
        return toDouble(b['volume']).compareTo(toDouble(a['volume']));
      });

      final List<dynamic> sortedByGain = List.from(stocks);
      sortedByGain.sort((a, b) {
        // Helper to safely convert value to double
        double toDouble(dynamic value) {
          if (value == null) return 0.0;
          if (value is num) return value.toDouble();
          if (value is String) return double.tryParse(value) ?? 0.0;
          return 0.0;
        }
        
        final aCurrentPrice = toDouble(a['current_price']);
        final aPreviousClose = toDouble(a['previous_close']);
        final bCurrentPrice = toDouble(b['current_price']);
        final bPreviousClose = toDouble(b['previous_close']);
        
        final aChange = aPreviousClose > 0 ? (aCurrentPrice - aPreviousClose) / aPreviousClose : 0.0;
        final bChange = bPreviousClose > 0 ? (bCurrentPrice - bPreviousClose) / bPreviousClose : 0.0;
        return bChange.compareTo(aChange);
      });

      final List<dynamic> sortedByLoss = List.from(sortedByGain).reversed.toList();

      return {
        'trending': sortedByVolume.take(5).toList(),
        'topGainers': sortedByGain.take(5).toList(),
        'topLosers': sortedByLoss.take(5).toList(),
        'totalStocks': stocks.length,
      };
    } catch (e) {
      print('Error fetching dashboard data: $e');
      return {
        'trending': [],
        'topGainers': [],
        'topLosers': [],
        'totalStocks': 0,
      };
    }
  }

  // ============================================
  // Rate Limit & Freshness Handling Helpers
  // ============================================

  /// Extract freshness metadata from API response
  Map<String, dynamic>? extractFreshness(Map<String, dynamic> response) {
    return response['metadata']?['freshness'];
  }

  /// Check if response contains rate limit error (429)
  static bool isRateLimited(int statusCode) {
    return statusCode == 429;
  }

  /// Get user-friendly message for rate limit error
  static String getRateLimitMessage(int statusCode) {
    if (statusCode == 429) {
      return 'API rate limit exceeded - please wait before retrying';
    }
    if (statusCode == 503) {
      return 'Server is temporarily unavailable - try again in a few moments';
    }
    if (statusCode == 500) {
      return 'Server error - the issue is being investigated';
    }
    return 'An error occurred while connecting to the server';
  }

  /// Handle HTTP response errors with proper categorization
  Exception handleResponseError(int statusCode, String body) {
    if (statusCode == 429) {
      return Exception('API rate limit exceeded (429) - please wait 30 seconds before retrying');
    }
    if (statusCode == 400 || statusCode == 422) {
      try {
        final error = jsonDecode(body);
        return Exception('Invalid request: ${error['error'] ?? 'Bad request'}');
      } catch (_) {
        return Exception('Invalid request format');
      }
    }
    if (statusCode == 401 || statusCode == 403) {
      return Exception('Authentication failed - please login again');
    }
    if (statusCode == 404) {
      return Exception('Resource not found');
    }
    if (statusCode == 500 || statusCode == 502 || statusCode == 503) {
      return Exception('Server error - please try again later');
    }
    return Exception('HTTP Error $statusCode');
  }
}
