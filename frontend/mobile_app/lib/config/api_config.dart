import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  // Automatically detects platform and uses appropriate URL
  // Android Emulator: 10.0.2.2
  // iOS Simulator/Web/Desktop: localhost
  // Physical Device: Update _getBaseUrl() with your computer's IP
  
  static String _getBaseUrl() {
    if (kIsWeb) {
      // For web (Chrome, Firefox, etc.)
      return 'http://localhost:5000';
    } else if (Platform.isAndroid) {
      // For Android emulator
      return 'http://10.0.2.2:5000';
    } else {
      // For iOS simulator, Windows/Mac/Linux desktop
      return 'http://localhost:5000';
    }
  }
  
  static String get baseUrl => _getBaseUrl();
  
  static const String screenerEndpoint = '/screener/run';
  static const String healthEndpoint = '/health';
  
  static String get screenerUrl => '$baseUrl$screenerEndpoint';
  static String get healthUrl => '$baseUrl$healthEndpoint';
}
