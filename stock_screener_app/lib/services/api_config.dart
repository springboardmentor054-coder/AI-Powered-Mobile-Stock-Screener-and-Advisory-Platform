import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb;

/// Central API endpoint resolver for all app services.
///
/// Priority:
/// 1) --dart-define=API_BASE_URL=...
/// 2) Platform-aware local defaults
class ApiConfig {
  static String get baseUrl {
    const env = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (env.trim().isNotEmpty) {
      return _normalize(env.trim());
    }

    if (kIsWeb) {
      return 'http://localhost:5000';
    }

    // Android devices/emulators can use localhost when adb reverse is active.
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://localhost:5000';
    }

    // iOS simulator + desktop.
    return 'http://localhost:5000';
  }

  static const String physicalDeviceHint =
      'If using a physical Android phone: run `adb reverse tcp:5000 tcp:5000` (USB) or use --dart-define=API_BASE_URL=http://<YOUR_PC_IP>:5000';

  static String _normalize(String url) {
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }
}
