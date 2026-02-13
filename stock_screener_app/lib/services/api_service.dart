import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../widgets/rate_limit_handler.dart';
import 'api_config.dart';

class ApiService {
  static String get baseUrl => ApiConfig.baseUrl;

  static const Duration defaultTimeout = Duration(seconds: 60);
  static const Duration healthTimeout = Duration(seconds: 10);

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
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'query': query}),
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
        final isSuccess =
            (jsonData is Map<String, dynamic>) &&
            (jsonData['success'] == true || jsonData['status'] == 'success');

        if (!isSuccess) {
          final message = _extractErrorMessage(jsonData);
          throw Exception('Server returned error: $message');
        }
        final jsonMap = jsonData;

        final rawData = (jsonMap['data'] is List)
            ? jsonMap['data'] as List<dynamic>
            : <dynamic>[];
        final cached = (jsonMap['metadata'] is Map)
            ? (jsonMap['metadata']['cached'] ?? false)
            : (jsonMap['cached'] ?? false);
        final data = rawData
            .whereType<Map<String, dynamic>>()
            .map(_normalizeStock)
            .toList();
        print(
          'Success: Received ${data.length} stocks ${cached ? '(from cache)' : ''}',
        );

        return data;
      } else if (response.statusCode == 400) {
        final error = jsonDecode(response.body);
        throw Exception('Invalid query: ${_extractErrorMessage(error)}');
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
          .get(Uri.parse('$baseUrl/api/portfolio/$userId'))
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
          'symbol': symbol.trim().toUpperCase(),
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

  /// Remove stock from portfolio
  Future<bool> removeFromPortfolio({
    required int userId,
    required String symbol,
  }) async {
    try {
      final request = http.Request(
        'DELETE',
        Uri.parse('$baseUrl/api/portfolio/remove'),
      );
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'userId': userId,
        'symbol': symbol.trim().toUpperCase(),
      });

      final streamed = await request.send().timeout(defaultTimeout);
      final response = await http.Response.fromStream(streamed);
      return response.statusCode == 200;
    } catch (e) {
      print('Error removing from portfolio: $e');
      return false;
    }
  }

  /// Get user's alerts
  Future<List<dynamic>> getAlerts(int userId, {bool unreadOnly = false}) async {
    try {
      final url =
          '$baseUrl/api/alerts/$userId${unreadOnly ? '?unreadOnly=true' : ''}';
      final response = await http.get(Uri.parse(url)).timeout(defaultTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        List<dynamic> rawAlerts = [];

        // Handle both array response and object with data field
        if (data is List) {
          rawAlerts = data;
        } else if (data is Map && data['data'] != null) {
          if (data['data'] is List) {
            rawAlerts = data['data'] as List<dynamic>;
          } else if (data['data'] is Map && data['data']['alerts'] != null) {
            rawAlerts = data['data']['alerts'] as List<dynamic>;
          }
        }

        return rawAlerts
            .whereType<Map<String, dynamic>>()
            .map(_normalizeAlert)
            .toList();
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
        Uri.parse('$baseUrl/api/screeners/$userId'),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final rawScreeners =
            (body is Map &&
                body['data'] is Map &&
                body['data']['screeners'] is List)
            ? (body['data']['screeners'] as List)
            : <dynamic>[];

        return rawScreeners
            .whereType<Map<String, dynamic>>()
            .map(_normalizeScreener)
            .toList();
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
        final body = jsonDecode(response.body);
        final data =
            (body is Map<String, dynamic> &&
                body['data'] is Map<String, dynamic>)
            ? body['data'] as Map<String, dynamic>
            : <String, dynamic>{};

        final unread = _toDouble(
          data['unread_count'] ?? data['unread'],
        ).toInt();
        final critical = _toDouble(
          data['critical_count'] ?? data['critical'],
        ).toInt();
        final high = _toDouble(data['high_count'] ?? data['high']).toInt();
        final total = _toDouble(data['total_active'] ?? data['total']).toInt();

        return {
          'success': true,
          'data': {
            ...data,
            'unread': unread,
            'critical': critical,
            'high': high,
            'total': total,
          },
        };
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

  /// Mark all alerts as read for a user
  Future<bool> markAllAlertsAsRead(int userId) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/api/alerts/$userId/read-all'),
        headers: {'Content-Type': 'application/json'},
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error marking all alerts as read: $e');
      return false;
    }
  }

  /// Create an alert for a stock
  Future<bool> createAlert({
    required int userId,
    required String symbol,
    required String alertType,
    double? targetPrice,
    String severity = 'medium',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/alerts'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'symbol': symbol.trim().toUpperCase(),
          'alertType': alertType,
          'targetPrice': targetPrice,
          'severity': severity,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return data is Map<String, dynamic> && data['success'] == true;
      }
      return false;
    } catch (e) {
      print('Error creating alert: $e');
      return false;
    }
  }

  /// Get system status
  Future<Map<String, dynamic>?> getSystemStatus() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/admin/status'));

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
        if (data is Map<String, dynamic> &&
            data['data'] is Map<String, dynamic>) {
          final raw = data['data'] as Map<String, dynamic>;
          return {
            ...raw,
            'currentPrice': _toDouble(
              raw['current_price'] ?? raw['currentPrice'],
            ),
            'previousClose': _toDouble(
              raw['previous_close'] ?? raw['previousClose'],
            ),
            'change': _toDouble(raw['change']),
            'changePercent': _toDouble(
              raw['change_percent'] ?? raw['changePercent'],
            ),
            'high': _toDouble(raw['high']),
            'low': _toDouble(raw['low']),
            'open': _toDouble(raw['open']),
            'volume': _toDouble(raw['volume']),
            'timestamp': raw['timestamp'],
          };
        }
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
      print('Checking backend health at: $baseUrl/health');
      final response = await http
          .get(Uri.parse('$baseUrl/health'))
          .timeout(const Duration(seconds: 15)); // Give device time to connect
      print('Backend health check: ${response.statusCode}');
      return response.statusCode == 200;
    } on TimeoutException catch (e) {
      print('Health check timeout: $e');
      return false;
    } catch (e) {
      print('Health check failed: $e');
      return false;
    }
  }

  /// Get all stocks (simple list)
  Future<List<dynamic>> getAllStocks() async {
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/stocks'))
          .timeout(defaultTimeout);

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);

        // Backend returns: { success: true, data: [...], count: N }
        // Extract the 'data' array
        if (jsonData is Map<String, dynamic> && jsonData['data'] is List) {
          return (jsonData['data'] as List<dynamic>)
              .whereType<Map<String, dynamic>>()
              .map(_normalizeStock)
              .toList();
        }

        // Fallback: if response is already a list
        if (jsonData is List) {
          return jsonData
              .whereType<Map<String, dynamic>>()
              .map(_normalizeStock)
              .toList();
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

        final aDirect = toDouble(a['change_percent']);
        final bDirect = toDouble(b['change_percent']);

        final aCurrentPrice = toDouble(a['current_price']);
        final aPreviousClose = toDouble(a['previous_close']);
        final bCurrentPrice = toDouble(b['current_price']);
        final bPreviousClose = toDouble(b['previous_close']);

        final aChange = aDirect != 0
            ? aDirect
            : (aPreviousClose > 0
                  ? ((aCurrentPrice - aPreviousClose) / aPreviousClose) * 100
                  : 0.0);
        final bChange = bDirect != 0
            ? bDirect
            : (bPreviousClose > 0
                  ? ((bCurrentPrice - bPreviousClose) / bPreviousClose) * 100
                  : 0.0);
        return bChange.compareTo(aChange);
      });

      final List<dynamic> sortedByLoss = List.from(
        sortedByGain,
      ).reversed.toList();

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

  double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  double _derivePreviousClose(double currentPrice, double changePercent) {
    if (currentPrice <= 0) return 0.0;
    final denominator = 1 + (changePercent / 100);
    if (denominator == 0) return currentPrice;
    return currentPrice / denominator;
  }

  String _extractErrorMessage(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      if (payload['error'] is String &&
          payload['error'].toString().isNotEmpty) {
        return payload['error'].toString();
      }
      if (payload['error'] is Map<String, dynamic>) {
        final nested = payload['error'] as Map<String, dynamic>;
        if (nested['message'] != null) {
          return nested['message'].toString();
        }
      }
      if (payload['message'] != null) {
        return payload['message'].toString();
      }
    }
    return 'Unknown error';
  }

  Map<String, dynamic> _normalizeStock(Map<String, dynamic> stock) {
    final companyName = _normalizeCompanyName(
      stock['company_name'] ?? stock['companyName'] ?? stock['name'],
    );
    final normalizedSector = _normalizeSector(
      stock['sector'] ?? stock['industry'] ?? stock['category'],
    );
    final symbol = _deriveSymbol(stock['symbol'], companyName);
    final currentPrice = _toDouble(
      stock['current_price'] ??
          stock['currentPrice'] ??
          stock['ltp'] ??
          stock['price'],
    );
    final changePercent = _toDouble(
      stock['change_percent'] ?? stock['changePercent'] ?? stock['change_pct'],
    );
    final previousClose = _toDouble(
      stock['previous_close'] ?? stock['previousClose'],
    );
    final resolvedPreviousClose = previousClose > 0
        ? previousClose
        : _derivePreviousClose(currentPrice, changePercent);

    final marketCap = _toDouble(
      stock['market_cap'] ?? stock['market_cap_cr'] ?? stock['marketCap'],
    );
    final volume = _toDouble(stock['volume']);
    final peRatio = _toDouble(stock['pe_ratio'] ?? stock['peRatio']);
    final roe = _toDouble(stock['roe']);
    final debtToEquity = _toDouble(
      stock['debt_to_equity'] ??
          stock['debtToEquity'] ??
          stock['debt_to_fcf'] ??
          stock['debtToFcf'],
    );

    return {
      ...stock,
      'symbol': symbol,
      'name': companyName,
      'company_name': companyName,
      'companyName': companyName,
      'sector': normalizedSector,
      'current_price': currentPrice,
      'currentPrice': currentPrice,
      'price': currentPrice,
      'previous_close': resolvedPreviousClose,
      'previousClose': resolvedPreviousClose,
      'change_percent': changePercent,
      'changePercent': changePercent,
      'change_pct': changePercent,
      'market_cap': marketCap,
      'market_cap_cr': marketCap,
      'marketCap': marketCap,
      'volume': volume,
      'pe_ratio': peRatio,
      'peRatio': peRatio,
      'roe': roe,
      'debt_to_equity': debtToEquity,
      'debtToEquity': debtToEquity,
    };
  }

  String _deriveSymbol(dynamic symbol, dynamic name) {
    final explicit = symbol?.toString().trim() ?? '';
    if (explicit.isNotEmpty) {
      return explicit;
    }

    final rawName = name?.toString().trim() ?? '';
    if (rawName.isEmpty) {
      return 'NA';
    }

    final words = rawName
        .split(RegExp(r'\s+'))
        .where((w) => w.isNotEmpty)
        .toList();
    if (words.isEmpty) {
      return rawName.toUpperCase();
    }

    final firstWord = words.first.replaceAll(RegExp(r'[^A-Za-z0-9]'), '');
    if (firstWord.length >= 3 && RegExp(r'^[A-Z0-9]+$').hasMatch(firstWord)) {
      return firstWord;
    }

    final acronym = words
        .map((w) => w.replaceAll(RegExp(r'[^A-Za-z0-9]'), ''))
        .where((w) => w.isNotEmpty)
        .take(5)
        .map((w) => w[0].toUpperCase())
        .join();

    final end = rawName.length.clamp(1, 5).toInt();
    return acronym.isNotEmpty
        ? acronym
        : rawName.substring(0, end).toUpperCase();
  }

  Map<String, dynamic> _normalizeAlert(Map<String, dynamic> alert) {
    final isRead =
        alert['isRead'] == true ||
        alert['is_read'] == true ||
        alert['read'] == true;
    final createdAt =
        alert['createdAt'] ??
        alert['created_at'] ??
        alert['triggeredAt'] ??
        alert['triggered_at'];
    final title = alert['title']?.toString() ?? 'Alert';
    final description = alert['description']?.toString() ?? '';

    return {
      ...alert,
      'isRead': isRead,
      'is_read': isRead,
      'createdAt': createdAt,
      'created_at': createdAt,
      'message': description.isNotEmpty ? description : title,
      'severity': (alert['severity']?.toString() ?? 'low'),
      'symbol': alert['symbol']?.toString() ?? 'NA',
      'companyName': _normalizeCompanyName(
        alert['company_name'] ?? alert['companyName'] ?? alert['name'],
      ),
    };
  }

  String _normalizeCompanyName(dynamic value) {
    final raw = value?.toString().trim() ?? '';
    if (raw.isEmpty ||
        raw.toLowerCase() == 'unknown' ||
        raw.toLowerCase() == 'n/a' ||
        raw.toLowerCase() == 'na') {
      return 'Not Available';
    }
    return raw;
  }

  String _normalizeSector(dynamic value) {
    final raw = value?.toString().trim() ?? '';
    if (_isMissingCategory(raw)) {
      return '';
    }

    if (raw.length <= 3) {
      return raw.toUpperCase();
    }

    return raw;
  }

  bool _isMissingCategory(String value) {
    final normalized = value.trim().toLowerCase();
    if (normalized.isEmpty) return true;
    return normalized == 'unknown' ||
        normalized == 'n/a' ||
        normalized == 'na' ||
        normalized == 'null' ||
        normalized == 'none' ||
        normalized == 'unspecified' ||
        normalized == 'not available';
  }

  Map<String, dynamic> _normalizeScreener(Map<String, dynamic> screener) {
    final dsl = (screener['dsl_query'] is Map<String, dynamic>)
        ? screener['dsl_query'] as Map<String, dynamic>
        : <String, dynamic>{};
    final query =
        (screener['description']?.toString().trim().isNotEmpty == true)
        ? screener['description'].toString()
        : _dslToReadableQuery(dsl);

    return {
      ...screener,
      'id': screener['id'],
      'name': screener['name'] ?? 'Saved Screener',
      'query': query,
      'conditions': dsl,
      'lastRun': screener['updated_at'] ?? screener['created_at'],
      'resultCount': screener['matched_stocks_count'] ?? 0,
    };
  }

  String _dslToReadableQuery(Map<String, dynamic> dsl) {
    final sector = dsl['sector'];
    final filters = (dsl['filters'] is List)
        ? dsl['filters'] as List
        : const [];
    final parts = <String>[];

    if (sector is String && sector.trim().isNotEmpty) {
      parts.add('${sector.trim()} stocks');
    } else {
      parts.add('stocks');
    }

    for (final raw in filters) {
      if (raw is! Map<String, dynamic>) continue;
      final field = raw['field']?.toString();
      final op = raw['operator']?.toString();
      final value = raw['value'];
      if (field == null || op == null || value == null) continue;
      parts.add('$field $op $value');
    }

    return 'Show ${parts.join(' with ')}';
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
      return Exception(
        'API rate limit exceeded (429) - please wait 30 seconds before retrying',
      );
    }
    if (statusCode == 400 || statusCode == 422) {
      try {
        final error = jsonDecode(body);
        final message = _extractErrorMessage(error);
        return Exception('Invalid request: $message');
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
