import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform, TargetPlatform;

class SuggestionsService {
  // Use platform-specific base URL
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

  String get baseUrl => '$_apiBaseUrl/api/suggestions';

  /// Get query suggestions based on input
  Future<Map<String, dynamic>> getSuggestions(String query) async {
    try {
      final url = Uri.parse('$baseUrl?q=${Uri.encodeComponent(query)}');
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return Map<String, dynamic>.from(data['data']);
        }
      }
      return {
        'suggestions': [],
        'sectors': [],
        'symbols': [],
      };
    } catch (e) {
      print('❌ Error fetching suggestions: $e');
      return {
        'suggestions': [],
        'sectors': [],
        'symbols': [],
      };
    }
  }

  /// Get all available sectors
  Future<List<String>> getSectors() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/sectors'));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final List<dynamic> sectors = data['data']['sectors'] ?? [];
          return sectors.cast<String>();
        }
      }
      return [];
    } catch (e) {
      print('❌ Error fetching sectors: $e');
      return [];
    }
  }

  /// Get stock symbols with search filter
  Future<List<Map<String, dynamic>>> getSymbols({String? search}) async {
    try {
      var url = '$baseUrl/symbols';
      if (search != null && search.isNotEmpty) {
        url += '?search=${Uri.encodeComponent(search)}';
      }
      
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final List<dynamic> symbols = data['data']['symbols'] ?? [];
          return symbols.cast<Map<String, dynamic>>();
        }
      }
      return [];
    } catch (e) {
      print('❌ Error fetching symbols: $e');
      return [];
    }
  }
}
