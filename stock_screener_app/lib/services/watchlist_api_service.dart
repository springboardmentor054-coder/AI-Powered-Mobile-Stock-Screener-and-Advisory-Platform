import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';

class WatchlistApiService {
  String get baseUrl => '${ApiConfig.baseUrl}/api/watchlist';

  /// Get user's watchlist with normalized stock fields.
  Future<List<Map<String, dynamic>>> getWatchlist(int userId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/$userId'));

      if (response.statusCode != 200) {
        throw Exception('Failed to fetch watchlist: ${response.statusCode}');
      }

      final data = json.decode(response.body);
      if (data['success'] != true || data['data'] == null) {
        return [];
      }

      final List<dynamic> watchlist = data['data']['watchlist'] ?? [];
      return watchlist
          .whereType<Map<String, dynamic>>()
          .map(_normalizeWatchlistItem)
          .toList();
    } catch (e) {
      print('Error fetching watchlist: $e');
      throw Exception('Error fetching watchlist: $e');
    }
  }

  /// Add stock to watchlist
  Future<bool> addToWatchlist(int userId, String symbol) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/add'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId, 'symbol': symbol.toUpperCase()}),
      );

      if (response.statusCode == 201) {
        print('Added $symbol to watchlist');
        return true;
      }
      if (response.statusCode == 409) {
        print('$symbol already in watchlist');
        return false;
      }

      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Failed to add to watchlist');
    } catch (e) {
      print('Error adding to watchlist: $e');
      throw Exception('Error adding to watchlist: $e');
    }
  }

  /// Remove stock from watchlist
  Future<bool> removeFromWatchlist(int userId, String symbol) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/remove'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId, 'symbol': symbol.toUpperCase()}),
      );

      if (response.statusCode == 200) {
        print('Removed $symbol from watchlist');
        return true;
      }

      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Failed to remove from watchlist');
    } catch (e) {
      print('Error removing from watchlist: $e');
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
      print('Error checking watchlist status: $e');
      return false;
    }
  }

  /// Toggle watchlist status
  Future<bool> toggleWatchlist(int userId, String symbol) async {
    final isWatched = await isInWatchlist(userId, symbol);

    if (isWatched) {
      await removeFromWatchlist(userId, symbol);
      return false;
    }

    await addToWatchlist(userId, symbol);
    return true;
  }

  Map<String, dynamic> _normalizeWatchlistItem(Map<String, dynamic> raw) {
    final currentPrice = _toDouble(raw['current_price'] ?? raw['currentPrice']);
    final previousClose = _toDouble(
      raw['previous_close'] ?? raw['previousClose'],
      fallback: currentPrice,
    );
    final change = currentPrice - previousClose;
    final changePercent = previousClose == 0
        ? _toDouble(raw['change_percent'] ?? raw['changePercent'])
        : ((change / previousClose) * 100);

    return {
      ...raw,
      'symbol': raw['symbol']?.toString().trim() ?? '',
      'name':
          raw['name']?.toString().trim() ??
          raw['company_name']?.toString().trim() ??
          raw['companyName']?.toString().trim() ??
          '',
      'sector': raw['sector']?.toString().trim() ?? '',
      'exchange': raw['exchange']?.toString().trim() ?? '',
      'current_price': currentPrice,
      'currentPrice': currentPrice,
      'previous_close': previousClose,
      'previousClose': previousClose,
      'change': change,
      'change_percent': changePercent,
      'changePercent': changePercent,
      'pe_ratio': _nullableDouble(raw['pe_ratio'] ?? raw['peRatio']),
      'peRatio': _nullableDouble(raw['pe_ratio'] ?? raw['peRatio']),
      'market_cap': _nullableDouble(raw['market_cap'] ?? raw['marketCap']),
      'marketCap': _nullableDouble(raw['market_cap'] ?? raw['marketCap']),
      'eps': _nullableDouble(raw['eps']),
      'debt_to_fcf': _nullableDouble(raw['debt_to_fcf'] ?? raw['debtToFcf']),
      'debtToFcf': _nullableDouble(raw['debt_to_fcf'] ?? raw['debtToFcf']),
      'revenue_growth': _nullableDouble(
        raw['revenue_growth'] ?? raw['revenueGrowth'],
      ),
      'revenueGrowth': _nullableDouble(
        raw['revenue_growth'] ?? raw['revenueGrowth'],
      ),
      'volume': _nullableDouble(raw['volume']),
      'last_price_update':
          raw['last_price_update']?.toString() ??
          raw['lastPriceUpdate']?.toString(),
      'lastPriceUpdate':
          raw['lastPriceUpdate']?.toString() ??
          raw['last_price_update']?.toString(),
    };
  }

  double _toDouble(dynamic value, {double fallback = 0.0}) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    if (value is String) {
      final parsed = double.tryParse(value.replaceAll(',', '').trim());
      return parsed ?? fallback;
    }
    return fallback;
  }

  double? _nullableDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) {
      return double.tryParse(value.replaceAll(',', '').trim());
    }
    return null;
  }
}
