import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/wishlist_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ScreenerScreen extends StatefulWidget {
  const ScreenerScreen({super.key});

  @override
  State<ScreenerScreen> createState() => _ScreenerScreenState();
}

class _ScreenerScreenState extends State<ScreenerScreen> {
  final _queryController = TextEditingController();
  final _authService = AuthService();
  final _wishlistService = WishlistService();
  bool _isLoading = false;
  List<dynamic>? _results;
  String? _error;
  String? _dsl;
  String? _sql;
  Set<String> _wishlistSymbols = {}; // Track which stocks are in wishlist
  List<String> _recentQueries = []; // stored history


  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadWishlist();
    _loadRecentQueries();
  }

  Future<void> _loadWishlist() async {
    try {
      final wishlist = await _wishlistService.getWishlist();
      setState(() {
        _wishlistSymbols = wishlist.map((item) => item['symbol'] as String).toSet();
      });
    } catch (e) {
      // If error loading wishlist, just keep the set empty
    }
  }

  Future<void> _runScreener() async {
    String query = _queryController.text.trim();
    if (query.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a query')),
      );
      return;
    }
    // normalize units like 20000cr -> 200000000000
    query = _normalizeQueryUnits(query);
    _addRecentQuery(query);


    setState(() {
      _isLoading = true;
      _error = null;
      _results = null;
      _dsl = null;
      _sql = null;
    });

    try {
      final token = await _authService.getToken();
      final response = await ApiService.post(
        '/api/screener/run',
        {'query': query},
        token: token,
      );

      if (response['success'] == true) {
        setState(() {
          _results = response['data'] ?? [];
          _dsl = response['dsl'];
          _sql = response['sql'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = response['message'] ?? 'Failed to run screener';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  // convert simple unit suffixes to raw numbers
  String _normalizeQueryUnits(String input) {
    // handle crores (cr, crore) and lakhs (l, lakh)
    var normalized = input;
    final croreRegex = RegExp(r"(\d+(?:\.\d+)?)\s*(?:cr|crore)s?", caseSensitive: false);
    normalized = normalized.replaceAllMapped(croreRegex, (m) {
      final num val = double.parse(m[1]!);
      return (val * 10000000).toStringAsFixed(0);
    });
    final lakhRegex = RegExp(r"(\d+(?:\.\d+)?)\s*(?:l|lakh)s?", caseSensitive: false);
    normalized = normalized.replaceAllMapped(lakhRegex, (m) {
      final num val = double.parse(m[1]!);
      return (val * 100000).toStringAsFixed(0);
    });
    return normalized;
  }

  // recent queries persistence helpers
  Future<void> _loadRecentQueries() async {
    final prefs = await SharedPreferences.getInstance();
    final user = await _authService.getUserInfo();
    final key = 'recent_queries_${user['id'] ?? 'anonymous'}';
    final list = prefs.getStringList(key) ?? [];
    setState(() {
      _recentQueries = list;
    });
  }

  Future<void> _saveRecentQueries() async {
    final prefs = await SharedPreferences.getInstance();
    final user = await _authService.getUserInfo();
    final key = 'recent_queries_${user['id'] ?? 'anonymous'}';
    await prefs.setStringList(key, _recentQueries);
  }

  void _addRecentQuery(String query) {
    _recentQueries.remove(query);
    _recentQueries.insert(0, query);
    if (_recentQueries.length > 5) {
      _recentQueries = _recentQueries.sublist(0, 5);
    }
    _saveRecentQueries();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Stock Screener'),
        elevation: 2,
      ),
      body: CustomScrollView(
        slivers: [
          // query input header
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(16.0),
              color: Colors.grey[100],
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Natural Language Query',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Example: "Show me stocks with P/E ratio less than 15 and market cap greater than 1000 crores"',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                  const SizedBox(height: 16),
                  // recent queries (wrap to multiple lines on phone)
                  if (_recentQueries.isNotEmpty) ...[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _recentQueries.map((q) {
                        return ActionChip(
                          label: Text(q, style: const TextStyle(fontSize: 12)),
                          onPressed: () {
                            _queryController.text = q;
                            _runScreener();
                          },
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                  ],
                  TextField(
                    controller: _queryController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Enter your query here...',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _runScreener,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text('Run Screener'),
                    ),
                  ),
                  
                  // Show DSL and SQL buttons if available
                  if (_dsl != null || _sql != null) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (_dsl != null)
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _showDSL(),
                              icon: const Icon(Icons.code, size: 18),
                              label: const Text('View JSON'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                        if (_dsl != null && _sql != null) const SizedBox(width: 8),
                        if (_sql != null)
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _showSQL(),
                              icon: const Icon(Icons.storage, size: 18),
                              label: const Text('View SQL'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),

          // results slivers
          if (_isLoading)
            SliverFillRemaining(child: const Center(child: CircularProgressIndicator()))
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.red[300],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Error',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _error = null;
                          });
                        },
                        child: const Text('Dismiss'),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else if (_results == null)
            SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.search,
                        size: 80,
                        color: Colors.grey[300],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Ready to Screen',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Enter a natural language query above to find stocks',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else if (_results!.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.inbox,
                        size: 80,
                        color: Colors.grey[300],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No Results Found',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Try adjusting your criteria',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else ...[
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: const BoxDecoration(
                  color: Color(0xFFF7F2EA),
                  border: Border(
                    bottom: BorderSide(color: Color(0xFFE6E0D6)),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Color(0xFF4C7A5A)),
                    const SizedBox(width: 8),
                    Text(
                      'Found ${_results!.length} stocks',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: Color(0xFF2F2A24),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildResultCard(_results![index]),
                childCount: _results!.length,
              ),
            ),
          ],
        ],
      ),
    );
  }


  Widget _buildResultCard(Map<String, dynamic> stock) {
    final symbol = stock['symbol']?.toString() ?? 'N/A';
    final companyName = stock['company_name']?.toString() ?? 'N/A';
    final priceText = _formatPrice(stock['current_price']);
    final marketCap = stock['market_cap'] != null
        ? '₹${_formatNumber(stock['market_cap'])}'
        : '—';
    final peRatio = stock['pe_ratio'] != null ? stock['pe_ratio'].toString() : '—';

    return InkWell(
      onTap: () => _showStockDetails(stock),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE6E0D6)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 14,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFF1E9DD),
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Text(
                symbol.isNotEmpty ? symbol.substring(0, 1).toUpperCase() : 'S',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF5A4633),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    symbol,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF2F2A24),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    companyName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B6257),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildMetricChip('Mkt Cap', marketCap),
                      _buildMetricChip('P/E', peRatio),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  priceText,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF8B7355),
                  ),
                ),
                const SizedBox(height: 10),
                _buildWishlistButton(symbol),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F2EA),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE6E0D6)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF6B6257),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2F2A24),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWishlistButton(String symbol) {
    final isInWishlist = _wishlistSymbols.contains(symbol);
    return Container(
      decoration: BoxDecoration(
        color: isInWishlist ? const Color(0xFFFFF0F0) : const Color(0xFFF5F2ED),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isInWishlist ? const Color(0xFFF2B8B5) : const Color(0xFFE6E0D6),
        ),
      ),
      child: IconButton(
        onPressed: () => _toggleWishlist(symbol),
        icon: Icon(
          isInWishlist ? Icons.favorite : Icons.favorite_border,
          size: 18,
          color: isInWishlist ? const Color(0xFFC0392B) : const Color(0xFF8B7355),
        ),
        tooltip: isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist',
      ),
    );
  }

  String _formatNumber(dynamic value) {
    if (value == null) return 'N/A';
    final num = double.tryParse(value.toString()) ?? 0;
    if (num >= 10000000) {
      return '${(num / 10000000).toStringAsFixed(2)}Cr';
    } else if (num >= 100000) {
      return '${(num / 100000).toStringAsFixed(2)}L';
    }
    return num.toStringAsFixed(2);
  }

  String _formatPrice(dynamic value) {
    if (value == null) return 'N/A';
    final parsed = value is num ? value.toDouble() : double.tryParse(value.toString());
    if (parsed == null) return 'N/A';
    return '\$${parsed.toStringAsFixed(2)}';
  }

  Future<void> _toggleWishlist(String symbol) async {
    final isInWishlist = _wishlistSymbols.contains(symbol);

    try {
      if (isInWishlist) {
        await _wishlistService.removeFromWishlist(symbol);
        setState(() {
          _wishlistSymbols.remove(symbol);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$symbol removed from wishlist'),
              duration: const Duration(seconds: 2),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } else {
        await _wishlistService.addToWishlist(symbol);
        setState(() {
          _wishlistSymbols.add(symbol);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$symbol added to wishlist ❤️'),
              duration: const Duration(seconds: 2),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showStockDetails(Map<String, dynamic> stock) {
    int selectedDays = 30;
    final historyCache = <int, Future<List<_HistoryPoint>>>{};

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final symbol = stock['symbol']?.toString() ?? '';
          final historyFuture = historyCache.putIfAbsent(
            selectedDays,
            () => _fetchPriceHistory(symbol, selectedDays),
          );

          return Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 600, maxHeight: 700),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
              // Header with gradient
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF667EEA), Color(0xFF764BA2)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.show_chart,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            stock['symbol']?.toString() ?? 'N/A',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            stock['company_name']?.toString() ?? 'N/A',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.9),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // AI Insights Section
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              const Color(0xFF667EEA).withOpacity(0.1),
                              const Color(0xFF764BA2).withOpacity(0.1),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFF667EEA).withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF667EEA).withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    Icons.lightbulb,
                                    color: Color(0xFF667EEA),
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  'Why This Match?',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF667EEA),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              _generateInsights(stock),
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[700],
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      _buildSection(
                        'Price History',
                        Icons.show_chart,
                        [
                          _buildHistorySection(
                            selectedDays: selectedDays,
                            onDaysChanged: (days) {
                              setModalState(() {
                                selectedDays = days;
                              });
                            },
                            historyFuture: historyFuture,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Basic Info Section
                      _buildSection(
                        'Company Overview',
                        Icons.business,
                        [
                          _buildDetailRow('Sector', stock['sector']),
                          _buildDetailRow('Industry', stock['industry']),
                          _buildDetailRow('Exchange', stock['exchange']),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Valuation Metrics
                      _buildSection(
                        'Valuation Metrics',
                        Icons.assessment,
                        [
                          if (stock['current_price'] != null)
                            _buildDetailRow('Current Price', '\$${stock['current_price'].toStringAsFixed(2)}'),
                          _buildDetailRow('Market Cap', _formatNumber(stock['market_cap'])),
                          _buildDetailRow('P/E Ratio', stock['pe_ratio']?.toStringAsFixed(2) ?? 'N/A'),
                          _buildDetailRow('P/B Ratio', _formatPBRatio(stock)),
                          _buildDetailRow('Book Value/Share', _formatBookValue(stock)),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Financial Health
                      _buildSection(
                        'Financial Health',
                        Icons.health_and_safety,
                        [
                          _buildDetailRow('Debt to Equity', _formatDebtToEquity(stock)),
                          _buildDetailRow('ROE', _formatROE(stock)),
                          _buildDetailRow('Profit Margin', stock['profit_margin'] != null ? '${stock['profit_margin']}%' : 'N/A'),
                          _buildDetailRow('Operating Margin', stock['operating_margin'] != null ? '${stock['operating_margin']}%' : 'N/A'),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Returns & Ownership
                      _buildSection(
                        'Returns & Ownership',
                        Icons.trending_up,
                        [
                          _buildDetailRow('Dividend Yield', stock['dividend_yield'] != null ? '${stock['dividend_yield']}%' : 'No dividend'),
                          _buildDetailRow('Promoter Holding', stock['promoter_holding'] != null ? '${stock['promoter_holding']}%' : 'N/A'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Action Buttons
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(20),
                    bottomRight: Radius.circular(20),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                        label: const Text('Close'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          final symbol = stock['symbol'];
                          final isInWishlist = _wishlistSymbols.contains(symbol);
                          
                          try {
                            if (isInWishlist) {
                              await _wishlistService.removeFromWishlist(symbol);
                              setState(() {
                                _wishlistSymbols.remove(symbol);
                              });
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('$symbol removed from wishlist'),
                                    backgroundColor: Colors.orange,
                                  ),
                                );
                              }
                            } else {
                              await _wishlistService.addToWishlist(symbol);
                              setState(() {
                                _wishlistSymbols.add(symbol);
                              });
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('$symbol added to wishlist ❤️'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                              }
                            }
                            Navigator.pop(context);
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Failed: ${e.toString().replaceAll('Exception: ', '')}'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          }
                        },
                        icon: Icon(_wishlistSymbols.contains(stock['symbol'])
                            ? Icons.favorite
                            : Icons.favorite_border),
                        label: Text(_wishlistSymbols.contains(stock['symbol'])
                            ? 'Remove from Wishlist'
                            : 'Add to Wishlist'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF667EEA),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              ],
            ),
          ),
          );
        },
      ),
    );
  }

  String _generateInsights(Map<String, dynamic> stock) {
    List<String> insights = [];
    
    // Check P/E ratio
    if (stock['pe_ratio'] != null) {
      final pe = double.tryParse(stock['pe_ratio'].toString());
      if (pe != null) {
        if (pe < 15) {
          insights.add('✓ Low P/E ratio (${pe.toStringAsFixed(2)}) suggests the stock may be undervalued');
        } else if (pe > 30) {
          insights.add('• High P/E ratio (${pe.toStringAsFixed(2)}) indicates market expects strong growth');
        } else {
          insights.add('✓ Moderate P/E ratio (${pe.toStringAsFixed(2)}) in reasonable valuation range');
        }
      }
    }
    
    // Check market cap
    if (stock['market_cap'] != null) {
      final marketCap = double.tryParse(stock['market_cap'].toString()) ?? 0;
      if (marketCap >= 100000000000) {
        insights.add('✓ Large-cap company with market cap of ₹${_formatNumber(marketCap)}');
      } else if (marketCap >= 10000000000) {
        insights.add('✓ Mid-cap company with good growth potential');
      } else if (marketCap > 0) {
        insights.add('• Small-cap company with higher risk-reward profile');
      }
    }
    
    // Check profit margin
    if (stock['profit_margin'] != null) {
      final margin = double.tryParse(stock['profit_margin'].toString());
      if (margin != null && margin > 15) {
        insights.add('✓ Strong profit margin of ${margin.toStringAsFixed(1)}% shows good profitability');
      }
    }
    
    // Check debt levels
    if (stock['debt_to_equity'] != null) {
      final dte = double.tryParse(stock['debt_to_equity'].toString());
      if (dte != null) {
        if (dte < 0.5) {
          insights.add('✓ Low debt-to-equity ratio indicates strong financial position');
        } else if (dte > 2) {
          insights.add('⚠ High debt levels - review financial stability carefully');
        }
      }
    }
    
    // Check promoter holding
    if (stock['promoter_holding'] != null) {
      final holding = double.tryParse(stock['promoter_holding'].toString());
      if (holding != null && holding > 50) {
        insights.add('✓ High promoter holding (${holding.toStringAsFixed(1)}%) shows confidence in the company');
      }
    }
    
    // Check ROE
    if (stock['roe'] != null) {
      final roe = double.tryParse(stock['roe'].toString());
      if (roe != null && roe > 15) {
        insights.add('✓ Healthy ROE of ${roe.toStringAsFixed(1)}% demonstrates efficient capital usage');
      }
    }
    
    // Check dividend
    if (stock['dividend_yield'] != null) {
      final dividend = double.tryParse(stock['dividend_yield'].toString());
      if (dividend != null && dividend > 2) {
        insights.add('✓ Attractive dividend yield of ${dividend.toStringAsFixed(1)}% for income investors');
      }
    }
    
    if (insights.isEmpty) {
      insights.add('This stock matched your search criteria. Review the metrics below for detailed analysis.');
    }
    
    return insights.join('\n\n');
  }

  Widget _buildSection(String title, IconData icon, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFF667EEA)),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          Text(
            value?.toString() ?? 'N/A',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Future<List<_HistoryPoint>> _fetchPriceHistory(String symbol, int days) async {
    if (symbol.isEmpty) return [];
    final response = await ApiService.get('/api/prices/$symbol/chart?days=$days');
    if (response == null || response['success'] != true) {
      throw Exception('Unable to load price history');
    }

    final data = response['data'] as List<dynamic>? ?? [];
    final points = <_HistoryPoint>[];

    for (final item in data) {
      if (item is! Map) continue;
      final dateRaw = item['date']?.toString();
      final close = _toDouble(item['price'] ?? item['close']);
      if (dateRaw == null || close == null) continue;

      final date = DateTime.tryParse(dateRaw);
      if (date == null) continue;

      final open = _toDouble(item['open']) ?? close;
      final high = _toDouble(item['high']) ?? close;
      final low = _toDouble(item['low']) ?? close;
      final volume = _toDouble(item['volume']);

      points.add(
        _HistoryPoint(
          date: date,
          open: open,
          high: high,
          low: low,
          close: close,
          volume: volume,
        ),
      );
    }

    points.sort((a, b) => a.date.compareTo(b.date));
    return points;
  }

  Widget _buildHistorySection({
    required int selectedDays,
    required void Function(int days) onDaysChanged,
    required Future<List<_HistoryPoint>> historyFuture,
  }) {
    const ranges = [7, 30, 90, 180];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ranges
              .map(
                (days) => ChoiceChip(
                  label: Text('${days}D'),
                  selected: selectedDays == days,
                  onSelected: (_) => onDaysChanged(days),
                  selectedColor: const Color(0xFF667EEA).withOpacity(0.2),
                  labelStyle: TextStyle(
                    color: selectedDays == days ? const Color(0xFF3F4CFF) : const Color(0xFF5B6472),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 16),
        FutureBuilder<List<_HistoryPoint>>(
          future: historyFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return Text(
                'Failed to load price history',
                style: TextStyle(color: Colors.red[400], fontSize: 13),
              );
            }

            final points = snapshot.data ?? [];
            if (points.length < 2) {
              return const Text(
                'Not enough price history to plot charts.',
                style: TextStyle(color: Colors.grey, fontSize: 13),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildChartCard(
                  'Price Trend',
                  _buildPriceLineChart(points),
                ),
                const SizedBox(height: 12),
                _buildChartCard(
                  'Volume Activity',
                  _buildVolumeChart(points),
                ),
                const SizedBox(height: 12),
                _buildChartCard(
                  'Daily Price Change %',
                  _buildReturnChart(points),
                ),
                const SizedBox(height: 12),
                _buildChartCard(
                  'High-Low Range',
                  _buildRangeChart(points),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildChartCard(String title, Widget chart) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE6E0D6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2F2A24),
            ),
          ),
          const SizedBox(height: 12),
          AspectRatio(
            aspectRatio: 2.2,
            child: chart,
          ),
        ],
      ),
    );
  }

  Widget _buildPriceLineChart(List<_HistoryPoint> points) {
    final closes = points.map((p) => p.close).toList();
    final minY = closes.reduce(math.min);
    final maxY = closes.reduce(math.max);
    final range = maxY - minY;
    final safeRange = range == 0 ? maxY.abs().clamp(1.0, double.infinity) : range;
    final padding = safeRange * 0.08;
    final ma = _movingAverage(closes, 7);

    final closeSpots = List.generate(
      points.length,
      (i) => FlSpot(i.toDouble(), points[i].close),
    );

    final maSpots = List.generate(
      ma.length,
      (i) => FlSpot(i.toDouble(), ma[i]),
    );

    return LineChart(
      LineChartData(
        minX: 0,
        maxX: (points.length - 1).toDouble(),
        minY: minY - padding,
        maxY: maxY + padding,
        gridData: FlGridData(show: true, horizontalInterval: safeRange / 4),
        titlesData: _buildChartTitles(points),
        borderData: FlBorderData(show: false),
        lineTouchData: LineTouchData(
          handleBuiltInTouches: true,
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (_) => const Color(0xFF1F2937),
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                final index = spot.x.toInt();
                final price = spot.y.toStringAsFixed(2);
                final date = _formatShortDate(points[index].date);
                return LineTooltipItem(
                  '$date\n\$${price}',
                  const TextStyle(color: Colors.white),
                );
              }).toList();
            },
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: closeSpots,
            isCurved: true,
            color: const Color(0xFF667EEA),
            barWidth: 3,
            dotData: FlDotData(show: false),
          ),
          LineChartBarData(
            spots: maSpots,
            isCurved: true,
            color: const Color(0xFF4C7A5A),
            barWidth: 2,
            dashArray: [6, 4],
            dotData: FlDotData(show: false),
          ),
        ],
      ),
    );
  }

  Widget _buildVolumeChart(List<_HistoryPoint> points) {
    final volumes = points.map((p) => p.volume ?? 0).toList();
    final maxVolume = volumes.reduce(math.max);
    if (maxVolume == 0) {
      return const Center(
        child: Text('Volume data not available', style: TextStyle(color: Colors.grey)),
      );
    }

    return BarChart(
      BarChartData(
        maxY: maxVolume * 1.1,
        titlesData: _buildBarTitles(points),
        borderData: FlBorderData(show: false),
        gridData: FlGridData(show: true, horizontalInterval: maxVolume / 4),
        barTouchData: BarTouchData(
          enabled: true,
          touchTooltipData: BarTouchTooltipData(
            getTooltipColor: (_) => const Color(0xFF1F2937),
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              final date = _formatShortDate(points[groupIndex].date);
              final volume = _formatCompactNumber(volumes[groupIndex]);
              return BarTooltipItem(
                '$date\n$volume',
                const TextStyle(color: Colors.white),
              );
            },
          ),
        ),
        barGroups: List.generate(
          points.length,
          (i) => BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: volumes[i],
                width: 6,
                borderRadius: BorderRadius.circular(4),
                color: const Color(0xFF9C7B4F),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReturnChart(List<_HistoryPoint> points) {
    final returns = <double>[];
    for (var i = 1; i < points.length; i++) {
      final prev = points[i - 1].close;
      final current = points[i].close;
      final change = prev == 0 ? 0.0 : ((current - prev) / prev) * 100;
      returns.add(change);
    }

    final maxAbs = returns.isEmpty
        ? 1.0
        : returns.map((v) => v.abs()).reduce(math.max).clamp(1.0, double.infinity);

    return BarChart(
      BarChartData(
        maxY: maxAbs * 1.1,
        minY: -maxAbs * 1.1,
        titlesData: _buildBarTitles(points.sublist(1)),
        borderData: FlBorderData(show: false),
        gridData: FlGridData(show: true, horizontalInterval: maxAbs / 2),
        barTouchData: BarTouchData(
          enabled: true,
          touchTooltipData: BarTouchTooltipData(
            getTooltipColor: (_) => const Color(0xFF1F2937),
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              final date = _formatShortDate(points[groupIndex + 1].date);
              final change = returns[groupIndex].toStringAsFixed(2);
              return BarTooltipItem(
                '$date\n$change%',
                const TextStyle(color: Colors.white),
              );
            },
          ),
        ),
        barGroups: List.generate(
          returns.length,
          (i) {
            final value = returns[i];
            final color = value >= 0 ? const Color(0xFF4C7A5A) : const Color(0xFFC0392B);
            return BarChartGroupData(
              x: i,
              barRods: [
                BarChartRodData(
                  toY: value,
                  width: 6,
                  borderRadius: BorderRadius.circular(4),
                  color: color,
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildRangeChart(List<_HistoryPoint> points) {
    final ranges = points.map((p) => (p.high - p.low).abs()).toList();
    final maxRange = ranges.reduce(math.max);
    if (maxRange == 0) {
      return const Center(
        child: Text('Range data not available', style: TextStyle(color: Colors.grey)),
      );
    }

    return BarChart(
      BarChartData(
        maxY: maxRange * 1.1,
        titlesData: _buildBarTitles(points),
        borderData: FlBorderData(show: false),
        gridData: FlGridData(show: true, horizontalInterval: maxRange / 4),
        barTouchData: BarTouchData(
          enabled: true,
          touchTooltipData: BarTouchTooltipData(
            getTooltipColor: (_) => const Color(0xFF1F2937),
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              final date = _formatShortDate(points[groupIndex].date);
              final range = ranges[groupIndex].toStringAsFixed(2);
              return BarTooltipItem(
                '$date\nRange: $range',
                const TextStyle(color: Colors.white),
              );
            },
          ),
        ),
        barGroups: List.generate(
          points.length,
          (i) => BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: ranges[i],
                width: 6,
                borderRadius: BorderRadius.circular(4),
                color: const Color(0xFF6B6257),
              ),
            ],
          ),
        ),
      ),
    );
  }

  FlTitlesData _buildChartTitles(List<_HistoryPoint> points) {
    return FlTitlesData(
      rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
      topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
      leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 42)),
      bottomTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          interval: _labelInterval(points.length),
          getTitlesWidget: (value, meta) {
            final index = value.toInt();
            if (index < 0 || index >= points.length) return const SizedBox.shrink();
            return Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                _formatShortDate(points[index].date),
                style: const TextStyle(fontSize: 9, color: Color(0xFF6B6257)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            );
          },
        ),
      ),
    );
  }

  FlTitlesData _buildBarTitles(List<_HistoryPoint> points) {
    return FlTitlesData(
      rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
      topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
      leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 42)),
      bottomTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          interval: _labelInterval(points.length),
          getTitlesWidget: (value, meta) {
            final index = value.toInt();
            if (index < 0 || index >= points.length) return const SizedBox.shrink();
            return Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                _formatShortDate(points[index].date),
                style: const TextStyle(fontSize: 9, color: Color(0xFF6B6257)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            );
          },
        ),
      ),
    );
  }

  double _titleInterval(int length) {
    if (length <= 6) return 1;
    return (length / 3).roundToDouble().clamp(1.0, double.infinity);
  }

  double _labelInterval(int length) {
    // For more crowded x-axis, show fewer labels
    if (length <= 7) return 1;
    if (length <= 14) return 2;
    if (length <= 30) return 3;
    if (length <= 90) return 7;
    return 15;
  }

  List<double> _movingAverage(List<double> values, int window) {
    if (values.isEmpty) return [];
    final averages = <double>[];
    for (var i = 0; i < values.length; i++) {
      final start = math.max(0, i - window + 1);
      final slice = values.sublist(start, i + 1);
      final sum = slice.fold(0.0, (a, b) => a + b);
      averages.add(sum / slice.length);
    }
    return averages;
  }

  String _formatShortDate(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}';
  }

  String _formatCompactNumber(double value) {
    if (value >= 1000000000) {
      return '${(value / 1000000000).toStringAsFixed(1)}B';
    }
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    }
    if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}K';
    }
    return value.toStringAsFixed(0);
  }

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  String _formatBookValue(Map<String, dynamic> stock) {
    if (stock['book_value_per_share'] == null) return 'Data not available';
    final value = double.tryParse(stock['book_value_per_share'].toString());
    if (value == null) return 'Data not available';
    if (value < 0) return '₹${value.toStringAsFixed(2)} (Negative)';
    return '₹${value.toStringAsFixed(2)}';
  }

  String _formatPBRatio(Map<String, dynamic> stock) {
    if (stock['pb_ratio'] != null) {
      return stock['pb_ratio'].toString();
    }
    // Check if book value is negative
    if (stock['book_value_per_share'] != null) {
      final bookValue = double.tryParse(stock['book_value_per_share'].toString());
      if (bookValue != null && bookValue < 0) {
        return 'Cannot calculate (negative book value)';
      }
    }
    return 'Data not available';
  }

  String _formatDebtToEquity(Map<String, dynamic> stock) {
    if (stock['debt_to_equity'] != null) {
      return stock['debt_to_equity'].toString();
    }
    return 'Data not available';
  }

  String _formatROE(Map<String, dynamic> stock) {
    if (stock['roe'] != null) {
      final roe = double.tryParse(stock['roe'].toString());
      if (roe != null) {
        if (roe < 0) return '${roe.toStringAsFixed(2)}% (Negative)';
        return '${stock['roe']}%';
      }
    }
    // Check if equity is negative
    if (stock['book_value_per_share'] != null) {
      final bookValue = double.tryParse(stock['book_value_per_share'].toString());
      if (bookValue != null && bookValue < 0) {
        return 'Cannot calculate (negative equity)';
      }
    }
    return 'Data not available';
  }

  void _showDSL() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.code, color: Colors.blue),
            SizedBox(width: 8),
            Text('DSL JSON'),
          ],
        ),
        content: SingleChildScrollView(
          child: SelectableText(
            _dsl ?? 'No DSL available',
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 12,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showSQL() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.storage, color: Colors.green),
            SizedBox(width: 8),
            Text('SQL Query'),
          ],
        ),
        content: SingleChildScrollView(
          child: SelectableText(
            _sql ?? 'No SQL available',
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 12,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

class _HistoryPoint {
  final DateTime date;
  final double open;
  final double high;
  final double low;
  final double close;
  final double? volume;

  const _HistoryPoint({
    required this.date,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });
}
