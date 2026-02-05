import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Update this to your backend URL
  // For Android Emulator: use 10.0.2.2 instead of localhost
  // For iOS Simulator: use localhost
  // For physical device: use your computer's IP address
  // For Chrome web: use localhost (127.0.0.1 may have CORS issues)
  static const String baseUrl = 'http://localhost:5000';
  
  // Helper method to make GET requests
  static Future<dynamic> get(String endpoint, {String? token}) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Helper method to make POST requests
  static Future<dynamic> post(
    String endpoint,
    Map<String, dynamic> body, {
    String? token,
  }) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: jsonEncode(body),
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Handle API response
  static dynamic _handleResponse(http.Response response) {
    final statusCode = response.statusCode;
    final body = response.body;

    if (statusCode >= 200 && statusCode < 300) {
      // Success
      if (body.isEmpty) return null;
      return jsonDecode(body);
    } else if (statusCode >= 400 && statusCode < 500) {
      // Client error
      final error = jsonDecode(body);
      throw Exception(error['message'] ?? 'Request failed');
    } else if (statusCode >= 500) {
      // Server error
      throw Exception('Server error. Please try again later.');
    } else {
      throw Exception('Unexpected error occurred');
    }
  }
}
