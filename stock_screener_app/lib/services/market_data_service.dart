import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/stock_model.dart';
import 'api_config.dart';

/// Production-grade Market Data Service
/// Uses backend Finnhub API as single source of truth
/// Never calls external APIs directly - all data flows through backend
class MarketDataService {
  static String get _baseUrl => ApiConfig.baseUrl;

  static const String _timeout = '30s';

  /// Fetch single stock quote with all metadata
  /// @param symbol - Stock symbol (e.g., 'TCS.NS')
  /// @returns Complete quote object with data freshness info
  static Future<Map<String, dynamic>> getStockQuote(String symbol) async {
    try {
      final normalizedSymbol = _normalizeSymbol(symbol);
      final response = await http
          .get(Uri.parse('$_baseUrl/api/stocks/$normalizedSymbol/quote'))
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return _parseQuoteResponse(data['data']);
        }
      }

      // Return mock data as fallback
      return _getMockQuote(symbol);
    } catch (e) {
      print('Error fetching quote for $symbol: $e');
      return _getMockQuote(symbol);
    }
  }

  /// Fetch quotes for multiple stocks in parallel
  /// @param symbols - Array of stock symbols
  /// @returns Array of quote objects
  static Future<List<Map<String, dynamic>>> getStockQuotes(
    List<String> symbols,
  ) async {
    try {
      final normalizedSymbols = symbols.map(_normalizeSymbol).toList();

      final response = await http
          .post(
            Uri.parse('$_baseUrl/api/realtime/bulk'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'symbols': normalizedSymbols}),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] is List) {
          return (data['data'] as List)
              .map((q) => _parseQuoteResponse(q))
              .toList();
        }
      }

      // Return mock data as fallback
      return symbols.map((s) => _getMockQuote(s)).toList();
    } catch (e) {
      print('Error fetching quotes: $e');
      return symbols.map((s) => _getMockQuote(s)).toList();
    }
  }

  /// Get all stocks with prices
  /// This is the primary endpoint for dashboard
  static Future<List<Map<String, dynamic>>> getStocks() async {
    try {
      final response = await http
          .get(Uri.parse('$_baseUrl/stocks'))
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] is List) {
          return (data['data'] as List)
              .map((s) => _parseStockResponse(s))
              .toList();
        }
      }

      return [];
    } catch (e) {
      print('Error fetching stocks: $e');
      return [];
    }
  }

  /// Screen stocks using natural language query
  /// @param query - Natural language query (e.g., "Stocks with PE < 5")
  /// @returns Matching stocks with real-time prices
  static Future<List<Map<String, dynamic>>> screenStocks(String query) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/screener'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'query': query}),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] is List) {
          return (data['data'] as List)
              .map((s) => _parseStockResponse(s))
              .toList();
        }
      }

      return [];
    } catch (e) {
      print('Error screening stocks: $e');
      return [];
    }
  }

  /// Get user's watchlist with real-time prices
  /// @param userId - User ID
  /// @returns Watchlist items with current prices
  static Future<List<Map<String, dynamic>>> getWatchlist(int userId) async {
    try {
      final response = await http
          .get(Uri.parse('$_baseUrl/api/watchlist/$userId'))
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] is List) {
          return (data['data'] as List)
              .map((w) => _parseWatchlistItem(w))
              .toList();
        }
      }

      return [];
    } catch (e) {
      print('Error fetching watchlist: $e');
      return [];
    }
  }

  /// Get user's portfolio with P&L calculations
  /// @param userId - User ID
  /// @returns Portfolio with holdings and summary
  static Future<Map<String, dynamic>> getPortfolio(int userId) async {
    try {
      final response = await http
          .get(Uri.parse('$_baseUrl/api/portfolio/$userId'))
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return _parsePortfolioResponse(data['data']);
        }
      }

      return {
        'holdings': [],
        'summary': {
          'total_investment': 0.0,
          'current_value': 0.0,
          'total_gain_loss': 0.0,
          'total_gain_loss_percent': 0.0,
        },
      };
    } catch (e) {
      print('Error fetching portfolio: $e');
      return {
        'holdings': [],
        'summary': {
          'total_investment': 0.0,
          'current_value': 0.0,
          'total_gain_loss': 0.0,
          'total_gain_loss_percent': 0.0,
        },
      };
    }
  }

  /// Get market overview (gainers, losers, most active)
  static Future<Map<String, List<Stock>>> getMarketOverview() async {
    try {
      final response = await http
          .get(Uri.parse('$_baseUrl/api/market/overview'))
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] is Map) {
          return {
            'gainers': _parseStockList(data['data']['gainers'] ?? []),
            'losers': _parseStockList(data['data']['losers'] ?? []),
            'mostActive': _parseStockList(data['data']['mostActive'] ?? []),
          };
        }
      }

      return {'gainers': [], 'losers': [], 'mostActive': []};
    } catch (e) {
      print('Error fetching market overview: $e');
      return {'gainers': [], 'losers': [], 'mostActive': []};
    }
  }

  /// Get candlestick data (OHLC + volume)
  /// @param symbol - Stock symbol
  /// @param timeframe - 1D|1W|1M|3M|1Y|5Y
  static Future<List<Map<String, dynamic>>> getCandles(
    String symbol, {
    String timeframe = '1D',
  }) async {
    try {
      final normalizedSymbol = _normalizeSymbol(symbol);
      final response = await http
          .get(
            Uri.parse(
              '$_baseUrl/api/market/candles/$normalizedSymbol?timeframe=$timeframe',
            ),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] is Map) {
          final candles = data['data']['candles'] as List<dynamic>? ?? [];
          return candles.map((c) {
            if (c is! Map) return <String, dynamic>{};
            return <String, dynamic>{
              't': c['t'],
              'o': _parseDouble(c['o']),
              'h': _parseDouble(c['h']),
              'l': _parseDouble(c['l']),
              'c': _parseDouble(c['c']),
              'v': _parseInt(c['v']).toDouble(),
            };
          }).toList();
        }
      }

      return [];
    } catch (e) {
      print('Error fetching candles: $e');
      return [];
    }
  }

  // ============ HELPER METHODS ============

  /// Normalize symbol to include exchange suffix if needed
  static String _normalizeSymbol(String symbol) {
    if (symbol.isEmpty) return '';

    final upper = symbol.toUpperCase();

    // Already has exchange suffix
    if (upper.contains('.')) return upper;

    // Common Indian stocks - add .NS
    const indianStocks = [
      'TCS',
      'INFY',
      'RELIANCE',
      'HDFCBANK',
      'ICICIBANK',
      'SBIN',
      'WIPRO',
      'HCLTECH',
      'TECHM',
      'WIPRO',
    ];

    if (indianStocks.contains(upper)) {
      return '$upper.NS';
    }

    return upper;
  }

  /// Parse single quote response
  static Map<String, dynamic> _parseQuoteResponse(dynamic data) {
    if (data is! Map) return _getMockQuote('UNKNOWN');

    return {
      'symbol': data['symbol'] ?? 'UNKNOWN',
      'current_price': _parseDouble(data['current_price']),
      'previous_close': _parseDouble(data['previous_close']),
      'change': _parseDouble(data['change']),
      'change_percent': _parseDouble(data['change_percent']),
      'high': _parseDouble(data['high']),
      'low': _parseDouble(data['low']),
      'open': _parseDouble(data['open']),
      'volume': _parseInt(data['volume']),
      'timestamp': data['timestamp'] ?? DateTime.now().toIso8601String(),
      'data_source': data['data_source'] ?? 'UNKNOWN',
      'is_real_data': data['is_real_data'] ?? false,
      'is_delayed': data['is_delayed'] ?? false,
      'delay_minutes': _parseInt(data['delay_minutes']),
    };
  }

  /// Parse stock response
  static Map<String, dynamic> _parseStockResponse(dynamic data) {
    if (data is! Map) return {};

    return {
      'symbol': data['symbol'] ?? 'UNKNOWN',
      'name': data['name'] ?? 'Unknown Company',
      'sector': data['sector'] ?? 'Unknown',
      'current_price': _parseDouble(data['current_price']),
      'previous_close': _parseDouble(data['previous_close']),
      'change_percent': _parseDouble(data['change_percent']),
      'high': _parseDouble(data['high']),
      'low': _parseDouble(data['low']),
      'volume': _parseInt(data['volume']),
      'pe_ratio': _parseDouble(data['pe_ratio']),
      'market_cap': _parseDouble(data['market_cap']),
      'eps': _parseDouble(data['eps']),
      'last_update': data['last_update'] ?? DateTime.now().toIso8601String(),
      'data_source': data['data_source'] ?? 'UNKNOWN',
      'is_real_data': data['is_real_data'] ?? false,
      'is_delayed': data['is_delayed'] ?? false,
      'delay_minutes': _parseInt(data['delay_minutes']),
    };
  }

  /// Parse watchlist item
  static Map<String, dynamic> _parseWatchlistItem(dynamic data) {
    if (data is! Map) return {};

    return {
      ..._parseStockResponse(data),
      'watchlist_id': data['watchlist_id'],
      'added_at': data['added_at'],
    };
  }

  /// Parse portfolio response
  static Map<String, dynamic> _parsePortfolioResponse(dynamic data) {
    if (data is! Map) return {};

    return {
      'holdings': (data['holdings'] as List? ?? [])
          .map(
            (h) => {
              'symbol': h['symbol'] ?? 'UNKNOWN',
              'quantity': _parseDouble(h['quantity']),
              'avg_price': _parseDouble(h['avg_price']),
              'current_price': _parseDouble(h['current_price']),
              'investment': _parseDouble(h['investment']),
              'current_value': _parseDouble(h['current_value']),
              'gain_loss': _parseDouble(h['gain_loss']),
              'gain_loss_percent': _parseDouble(h['gain_loss_percent']),
              'data_source': h['data_source'] ?? 'UNKNOWN',
              'is_delayed': h['is_delayed'] ?? false,
            },
          )
          .toList(),
      'summary': {
        'total_investment': _parseDouble(data['summary']?['total_investment']),
        'current_value': _parseDouble(data['summary']?['current_value']),
        'total_gain_loss': _parseDouble(data['summary']?['total_gain_loss']),
        'total_gain_loss_percent': _parseDouble(
          data['summary']?['total_gain_loss_percent'],
        ),
      },
    };
  }

  /// Parse stock list
  static List<Stock> _parseStockList(List<dynamic> data) {
    return data
        .whereType<Map<String, dynamic>>()
        .map(
          (s) => Stock(
            symbol: s['symbol'] ?? 'UNKNOWN',
            name: s['name'] ?? 'Unknown',
            sector: s['sector'] ?? 'Unknown',
            currentPrice: _parseDouble(s['current_price']),
            changePercent: _parseDouble(s['change_percent']),
            changeAmount: _parseDouble(s['change']),
            marketCap: _parseDouble(s['market_cap']),
            peRatio: _parseDouble(s['pe_ratio']),
            volume: _parseInt(s['volume']).toDouble(),
          ),
        )
        .toList();
  }

  /// Safe double parsing
  static double _parseDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  /// Safe int parsing
  static int _parseInt(dynamic value) {
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  /// Generate mock stock quote
  static Map<String, dynamic> _getMockQuote(String symbol) {
    final basePrice = 100.0 + ((symbol.hashCode % 500).toDouble());
    final change = -10.0 + ((symbol.hashCode % 20).toDouble());

    return {
      'symbol': symbol,
      'current_price': basePrice,
      'previous_close': basePrice - change,
      'change': change,
      'change_percent': (change / basePrice * 100),
      'high': basePrice + 5,
      'low': basePrice - 5,
      'open': basePrice - 2,
      'volume': (1000000 + (symbol.hashCode % 5000000)).toDouble(),
      'timestamp': DateTime.now().toIso8601String(),
      'data_source': 'MOCK',
      'is_real_data': false,
      'is_delayed': false,
      'delay_minutes': 0,
    };
  }
}
