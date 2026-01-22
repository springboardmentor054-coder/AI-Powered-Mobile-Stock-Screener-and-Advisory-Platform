import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Base URL for the backend API
  // Use PC's IP address to connect from phone (both on same WiFi: 192.168.1.x)
  static const String baseUrl = 'http://192.168.1.6:5000';

  /// Fetches stocks based on natural language query
  /// 
  /// Example query: "Show IT stocks with PE below 5"
  /// Returns a list of stocks matching the criteria
  static Future<List<dynamic>> fetchStocks(String query) async {
    try {
      print('📡 Sending query to API: $query');

      final response = await http.post(
        Uri.parse('$baseUrl/screener'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'query': query,
        }),
      );

      print('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        final data = jsonData['data'] as List<dynamic>;
        print('✅ Success: Received ${data.length} stocks');
        
        return data;
      } else if (response.statusCode == 400) {
        final error = jsonDecode(response.body);
        throw Exception('Invalid query: ${error['details'] ?? error['error']}');
      } else {
        throw Exception('Server error: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error fetching stocks: $e');
      rethrow;
    }
  }

  /// Checks if the backend server is running
  static Future<bool> checkHealth() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/health'));
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Health check failed: $e');
      return false;
    }
  }
}
