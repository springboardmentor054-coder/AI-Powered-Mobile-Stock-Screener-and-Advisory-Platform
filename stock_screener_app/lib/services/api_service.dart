import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Base URL for the backend API
  // localhost = Chrome/desktop, 10.0.2.2 = Android emulator, 192.168.x.x = physical device
  static const String baseUrl = 'http://10.20.136.30:5000';

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
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout - server took too long to respond');
        },
      );

      print('📥 Response status: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        
        // Check if success field exists and is true
        if (jsonData['success'] != true) {
          throw Exception('Server returned error: ${jsonData['error'] ?? 'Unknown error'}');
        }
        
        final data = jsonData['data'] as List<dynamic>;
        print('✅ Success: Received ${data.length} stocks');
        
        return data;
      } else if (response.statusCode == 400) {
        final error = jsonDecode(response.body);
        throw Exception('Invalid query: ${error['error'] ?? 'Bad request'}');
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
