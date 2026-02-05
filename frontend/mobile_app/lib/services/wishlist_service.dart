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
        return data['wishlist'] ?? [];
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
}
