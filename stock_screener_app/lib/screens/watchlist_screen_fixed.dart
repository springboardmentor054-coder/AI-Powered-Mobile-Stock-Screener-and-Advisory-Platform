import 'package:flutter/material.dart';
import 'dart:async';
import '../services/watchlist_api_service.dart';
import '../services/api_service.dart';
import '../models/stock_model.dart';
import 'stock_detail_screen.dart';

class WatchlistScreenFixed extends StatefulWidget {
  const WatchlistScreenFixed({super.key});

  @override
  State<WatchlistScreenFixed> createState() => _WatchlistScreenFixedState();
}

class _WatchlistScreenFixedState extends State<WatchlistScreenFixed> {
  List<Map<String, dynamic>> _watchlist = [];
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _errorMessage;
  Timer? _refreshTimer;
  
  final WatchlistApiService _watchlistService = WatchlistApiService();
  final ApiService _apiService = ApiService();
  final int _userId = 1;

  @override
  void initState() {
    super.initState();
    _loadWatchlist();
    _startAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  void _startAutoRefresh() {
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _refreshWatchlist(silent: true);
    });
  }

  Future<void> _loadWatchlist() async {
    if (!mounted) return;
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final watchlist = await _watchlistService.getWatchlist(_userId);
      
      if (mounted) {
        setState(() {
          _watchlist = watchlist;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load watchlist: ${e.toString()}';
          _isLoading = false;
        });
      }
      print('Error loading watchlist: $e');
    }
  }

  Future<void> _refreshWatchlist({bool silent = false}) async {
    if (!mounted || _watchlist.isEmpty) return;

    if (!silent) {
      setState(() => _isRefreshing = true);
    }

    try {
      final watchlist = await _watchlistService.getWatchlist(_userId);
      if (mounted) {
        setState(() {
          _watchlist = watchlist;
          _isRefreshing = false;
        });
      }
    } catch (e) {
      if (mounted && !silent) {
        setState(() => _isRefreshing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error refreshing: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _removeFromWatchlist(String symbol) async {
    try {
      await _watchlistService.removeFromWatchlist(_userId, symbol);
      await _loadWatchlist();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$symbol removed from watchlist'),
            action: SnackBarAction(
              label: 'Undo',
              onPressed: () async {
                await _watchlistService.addToWatchlist(_userId, symbol);
                await _loadWatchlist();
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error removing stock: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('📊 My Watchlist'),
        elevation: 0,
        actions: [
          if (_watchlist.isNotEmpty)
            IconButton(
              icon: _isRefreshing
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation(Colors.white),
                      ),
                    )
                  : const Icon(Icons.refresh),
              onPressed: _isRefreshing ? null : () => _refreshWatchlist(),
              tooltip: 'Refresh prices',
            ),
        ],
      ),
      body: _isLoading
          ? _buildLoadingState()
          : _errorMessage != null
              ? _buildErrorState()
              : _watchlist.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: _refreshWatchlist,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _watchlist.length,
                        itemBuilder: (context, index) {
                          final stock = _watchlist[index];
                          return _buildWatchlistCard(stock);
                        },
                      ),
                    ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation(Color(0xFF3B82F6)),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Loading your watchlist...',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 80, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(
            'Oops! Something went wrong',
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              _errorMessage ?? 'Unable to load watchlist',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadWatchlist,
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bookmark_border, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Your watchlist is empty',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Start by searching for stocks and adding them to your watchlist',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.search),
            label: const Text('Search Stocks'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWatchlistCard(Map<String, dynamic> stock) {
    final symbol = stock['symbol'] ?? 'N/A';
    final name = stock['name'] ?? 'Unknown';
    final currentPrice = (stock['current_price'] as num?)?.toDouble() ?? 0.0;
    final peRatio = (stock['pe_ratio'] as num?)?.toDouble() ?? 0.0;
    final marketCap = (stock['market_cap'] as num?)?.toDouble() ?? 0.0;
    final sector = stock['sector'] ?? 'N/A';
    
    // Calculate daily change
    final previousClose = (stock['previous_close'] as num?)?.toDouble() ?? currentPrice;
    final change = currentPrice - previousClose;
    final changePercent = previousClose != 0 ? (change / previousClose) * 100 : 0.0;
    
    final isPositive = change >= 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          final stockObj = Stock(
            symbol: symbol,
            name: name,
            sector: sector,
            currentPrice: currentPrice,
            changePercent: changePercent,
            changeAmount: change,
            peRatio: peRatio,
            marketCap: marketCap,
          );
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => StockDetailScreen(stock: stockObj),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Stock Badge
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isPositive
                        ? [const Color(0xFF10B981), const Color(0xFF34D399)]
                        : [const Color(0xFFEF4444), const Color(0xFFF87171)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    symbol.substring(0, min(3, symbol.length)),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),

              // Stock Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      symbol,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          sector,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        if (peRatio > 0) ...[
                          const SizedBox(width: 8),
                          Text(
                            'P/E: ${peRatio.toStringAsFixed(1)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              // Price & Change
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₹${currentPrice.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isPositive
                          ? const Color(0xFF10B981).withValues(alpha: 0.1)
                          : const Color(0xFFEF4444).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${isPositive ? '+' : ''}${changePercent.toStringAsFixed(2)}%',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isPositive
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444),
                      ),
                    ),
                  ),
                ],
              ),

              // Remove Button
              IconButton(
                icon: const Icon(Icons.close, size: 20),
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Remove from Watchlist?'),
                      content: Text('Remove $symbol from your watchlist?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Cancel'),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _removeFromWatchlist(symbol);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                          ),
                          child: const Text('Remove', style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

int min(int a, int b) => a < b ? a : b;
