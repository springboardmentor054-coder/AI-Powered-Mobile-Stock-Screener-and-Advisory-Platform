import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';
import 'auth_service.dart';

class WishlistService {
  final AuthService _authService = AuthService();

  // Get user's wishlist
  Future<List<dynamic>> getWishlist() async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('Not authenticated');

    try {
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/api/wishlist'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final wishlist = List<Map<String, dynamic>>.from(data['wishlist'] ?? []);
        
        // Convert string numbers to actual numbers
        return wishlist.map((item) {
          final Map<String, dynamic> converted = Map<String, dynamic>.from(item);
          
          // Price fields
          converted['current_price'] = _parseNumber(item['current_price']);
          converted['today_price'] = _parseNumber(item['today_price']);
          converted['yesterday_price'] = _parseNumber(item['yesterday_price']);
          converted['today_open'] = _parseNumber(item['today_open']);
          converted['today_high'] = _parseNumber(item['today_high']);
          converted['today_low'] = _parseNumber(item['today_low']);
          converted['latest_open'] = _parseNumber(item['latest_open']);
          converted['latest_high'] = _parseNumber(item['latest_high']);
          converted['latest_low'] = _parseNumber(item['latest_low']);
          converted['latest_close'] = _parseNumber(item['latest_close']);
          converted['previous_close'] = _parseNumber(item['previous_close']);
          
          // Change fields
          converted['price_change'] = _parseNumber(item['price_change']);
          converted['price_change_percentage'] = _parseNumber(item['price_change_percentage']);
          converted['volume_change_percentage'] = _parseNumber(item['volume_change_percentage']);
          
          // Fundamental fields
          converted['pe_ratio'] = _parseNumber(item['pe_ratio']);
          converted['yesterday_pe_ratio'] = _parseNumber(item['yesterday_pe_ratio']);
          converted['pb_ratio'] = _parseNumber(item['pb_ratio']);
          converted['eps'] = _parseNumber(item['eps']);
          converted['dividend_yield'] = _parseNumber(item['dividend_yield']);
          converted['beta'] = _parseNumber(item['beta']);
          converted['profit_margin'] = _parseNumber(item['profit_margin']);
          
          // Volume and market cap
          converted['market_cap'] = _parseNumber(item['market_cap']);
          converted['yesterday_market_cap'] = _parseNumber(item['yesterday_market_cap']);
          converted['volume'] = _parseNumber(item['volume']);
          converted['today_volume'] = _parseNumber(item['today_volume']);
          converted['yesterday_volume'] = _parseNumber(item['yesterday_volume']);
          converted['average_volume'] = _parseNumber(item['average_volume']);
          converted['latest_volume'] = _parseNumber(item['latest_volume']);
          converted['previous_volume'] = _parseNumber(item['previous_volume']);
          
          return converted;
        }).toList();
      } else {
        throw Exception('Failed to fetch wishlist');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Add stock to wishlist
  Future<void> addToWishlist(String symbol) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('Not authenticated');

    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/api/wishlist'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'symbol': symbol}),
      );

      if (response.statusCode != 201) {
        final data = json.decode(response.body);
        throw Exception(data['message'] ?? 'Failed to add to wishlist');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Remove stock from wishlist
  Future<void> removeFromWishlist(String symbol) async {
    final token = await _authService.getToken();
    if (token == null) throw Exception('Not authenticated');

    try {
      final response = await http.delete(
        Uri.parse('${ApiService.baseUrl}/api/wishlist/$symbol'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode != 200) {
        final data = json.decode(response.body);
        throw Exception(data['message'] ?? 'Failed to remove from wishlist');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Check if stock is in wishlist
  Future<bool> isInWishlist(String symbol) async {
    final token = await _authService.getToken();
    if (token == null) return false;

    try {
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/api/wishlist/check/$symbol'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['inWishlist'] ?? false;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Helper method to parse string or number to num
  num? _parseNumber(dynamic value) {
    if (value == null) return null;
    if (value is num) return value;
    if (value is String) {
      return num.tryParse(value);
    }
    return null;
  }
}
