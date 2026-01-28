import 'package:shared_preferences/shared_preferences.dart';

class WatchlistService {
  static const String _watchlistKey = 'user_watchlist';
  static const String _recentSearchesKey = 'recent_searches';

  /// Add stock to watchlist
  static Future<void> addToWatchlist(String symbol) async {
    final prefs = await SharedPreferences.getInstance();
    final watchlist = await getWatchlist();
    
    if (!watchlist.contains(symbol)) {
      watchlist.add(symbol);
      await prefs.setStringList(_watchlistKey, watchlist);
    }
  }

  /// Remove stock from watchlist
  static Future<void> removeFromWatchlist(String symbol) async {
    final prefs = await SharedPreferences.getInstance();
    final watchlist = await getWatchlist();
    
    watchlist.remove(symbol);
    await prefs.setStringList(_watchlistKey, watchlist);
  }

  /// Get all watchlist symbols
  static Future<List<String>> getWatchlist() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_watchlistKey) ?? [];
  }

  /// Check if stock is in watchlist
  static Future<bool> isInWatchlist(String symbol) async {
    final watchlist = await getWatchlist();
    return watchlist.contains(symbol);
  }

  /// Toggle watchlist status
  static Future<bool> toggleWatchlist(String symbol) async {
    final isWatched = await isInWatchlist(symbol);
    
    if (isWatched) {
      await removeFromWatchlist(symbol);
      return false;
    } else {
      await addToWatchlist(symbol);
      return true;
    }
  }

  /// Add recent search query
  static Future<void> addRecentSearch(String query) async {
    final prefs = await SharedPreferences.getInstance();
    final searches = await getRecentSearches();
    
    // Remove if already exists
    searches.remove(query);
    
    // Add to beginning
    searches.insert(0, query);
    
    // Keep only last 10 searches
    if (searches.length > 10) {
      searches.removeRange(10, searches.length);
    }
    
    await prefs.setStringList(_recentSearchesKey, searches);
  }

  /// Get recent search queries
  static Future<List<String>> getRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_recentSearchesKey) ?? [];
  }

  /// Clear all recent searches
  static Future<void> clearRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_recentSearchesKey);
  }
}
