import 'watchlist_api_service.dart';
import 'auth_service.dart';

/// Wrapper service for watchlist operations
class WatchlistService {
  static final WatchlistApiService _apiService = WatchlistApiService();

  static int _resolveUserId() => AuthService.instance.currentUserId ?? 1;

  /// Get user's watchlist
  static Future<List<String>> getWatchlist() async {
    try {
      final watchlist = await _apiService.getWatchlist(_resolveUserId());
      return watchlist.map((item) => item['symbol'].toString()).toList();
    } catch (e) {
      print('Error getting watchlist: $e');
      rethrow;
    }
  }

  /// Check if stock is in watchlist
  static Future<bool> isInWatchlist(String symbol) async {
    try {
      final watchlist = await getWatchlist();
      return watchlist.contains(symbol.toUpperCase());
    } catch (e) {
      print('Error checking watchlist: $e');
      return false;
    }
  }

  /// Add stock to watchlist
  static Future<bool> addToWatchlist(String symbol) async {
    try {
      return await _apiService.addToWatchlist(_resolveUserId(), symbol);
    } catch (e) {
      print('Error adding to watchlist: $e');
      rethrow;
    }
  }

  /// Remove stock from watchlist
  static Future<bool> removeFromWatchlist(String symbol) async {
    try {
      return await _apiService.removeFromWatchlist(_resolveUserId(), symbol);
    } catch (e) {
      print('Error removing from watchlist: $e');
      rethrow;
    }
  }

  /// Toggle stock in watchlist
  static Future<bool> toggleWatchlist(String symbol) async {
    try {
      final isWatched = await isInWatchlist(symbol);
      if (isWatched) {
        return await removeFromWatchlist(symbol);
      } else {
        return await addToWatchlist(symbol);
      }
    } catch (e) {
      print('Error toggling watchlist: $e');
      rethrow;
    }
  }
}
