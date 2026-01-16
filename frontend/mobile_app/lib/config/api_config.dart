class ApiConfig {
  // For Android Emulator: use 10.0.2.2
  // For iOS Simulator: use localhost
  // For Windows/Mac/Linux Desktop: use localhost
  // For Physical Device: use your computer's IP address (e.g., 192.168.1.100)
  
  static const String baseUrl = 'http://localhost:5000';
  
  static const String screenerEndpoint = '/screener/run';
  static const String healthEndpoint = '/health';
  
  static String get screenerUrl => '$baseUrl$screenerEndpoint';
  static String get healthUrl => '$baseUrl$healthEndpoint';
}
