import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'dart:math' as math;
import '../utils/colors.dart';
import '../services/watchlist_service.dart';
import '../models/stock_model.dart';
import 'stock_detail_screen.dart';

class ResultScreen extends StatefulWidget {
  final List<dynamic> results;
  final String query;

  const ResultScreen({
    super.key,
    required this.results,
    required this.query,
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  String _sortBy = 'market_cap';
  bool _sortAscending = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  List<dynamic> get _sortedResults {
    final sorted = List.from(widget.results);
    sorted.sort((a, b) {
      final aValue = a[_sortBy] ?? 0;
      final bValue = b[_sortBy] ?? 0;
      final comparison = _sortAscending
          ? Comparable.compare(aValue, bValue)
          : Comparable.compare(bValue, aValue);
      return comparison;
    });
    return sorted;
  }

  // Helper to safely parse numeric values from API
  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  Map<String, dynamic> get _insights {
    if (widget.results.isEmpty) return {};

    // Calculate P/E Ratio insights
    final peRatios = widget.results
        .where((s) => s['pe_ratio'] != null)
        .map((s) => _parseDouble(s['pe_ratio']))
        .where((v) => v > 0)
        .toList();
    
    final avgPE = peRatios.isEmpty
        ? 0.0
        : peRatios.reduce((a, b) => a + b) / peRatios.length;
    
    final minPE = peRatios.isEmpty ? 0.0 : peRatios.reduce(math.min);
    final maxPE = peRatios.isEmpty ? 0.0 : peRatios.reduce(math.max);

    // Calculate Market Cap insights
    final marketCaps = widget.results
        .where((s) => s['market_cap'] != null)
        .map((s) => _parseDouble(s['market_cap']))
        .where((v) => v > 0)
        .toList();
    
    final totalMarketCap = marketCaps.isEmpty
        ? 0.0
        : marketCaps.reduce((a, b) => a + b);
    
    final avgMarketCap = marketCaps.isEmpty
        ? 0.0
        : totalMarketCap / marketCaps.length;

    // Sector distribution
    final sectors = <String, int>{};
    for (var stock in widget.results) {
      final sector = stock['sector'] as String? ?? 'Unknown';
      sectors[sector] = (sectors[sector] ?? 0) + 1;
    }

    final topSector = sectors.isNotEmpty
        ? sectors.entries.reduce((a, b) => a.value > b.value ? a : b).key
        : 'N/A';

    return {
      'avgPE': avgPE,
      'minPE': minPE,
      'maxPE': maxPE,
      'totalMarketCap': totalMarketCap,
      'avgMarketCap': avgMarketCap,
      'sectors': sectors,
      'topSector': topSector,
      'stockCount': widget.results.length,
    };
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final insights = _insights;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              colorScheme.primaryContainer.withOpacity(0.3),
              colorScheme.surface,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              _buildHeader(context, colorScheme),

              // Insights Section
              if (widget.results.isNotEmpty) _buildInsights(insights, colorScheme),

              // Sort Options
              if (widget.results.isNotEmpty) _buildSortBar(colorScheme),

              // Results
              Expanded(
                child: widget.results.isEmpty
                    ? _buildEmptyState(colorScheme)
                    : _buildResultsList(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => Navigator.pop(context),
                color: colorScheme.primary,
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Search Results',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      '"${widget.query}"',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey.shade600,
                            fontStyle: FontStyle.italic,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${widget.results.length} stocks',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onPrimaryContainer,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInsights(Map<String, dynamic> insights, ColorScheme colorScheme) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colorScheme.primary.withOpacity(0.1),
            colorScheme.secondary.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colorScheme.primary.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: colorScheme.primary.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: colorScheme.primary.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.insights, color: colorScheme.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                'Market Insights',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${insights['stockCount']} stocks',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onPrimaryContainer,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // P/E Ratio Insights
          Text(
            'P/E Ratio Analysis',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade700,
                ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildInsightCard(
                  'Average',
                  insights['avgPE'].toStringAsFixed(2),
                  Icons.trending_up,
                  colorScheme,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInsightCard(
                  'Minimum',
                  insights['minPE'].toStringAsFixed(2),
                  Icons.arrow_downward,
                  colorScheme,
                  Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInsightCard(
                  'Maximum',
                  insights['maxPE'].toStringAsFixed(2),
                  Icons.arrow_upward,
                  colorScheme,
                  Colors.orange,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Market Cap Insights
          Text(
            'Market Capitalization',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade700,
                ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildInsightCard(
                  'Total Value',
                  _formatMarketCap(insights['totalMarketCap']),
                  Icons.account_balance,
                  colorScheme,
                  Colors.purple,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInsightCard(
                  'Avg Value',
                  _formatMarketCap(insights['avgMarketCap']),
                  Icons.bar_chart,
                  colorScheme,
                  Colors.indigo,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Sector Distribution
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colorScheme.outline.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.pie_chart, size: 20, color: colorScheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Sector Distribution',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ..._buildSectorBars(insights['sectors'] as Map<String, int>, colorScheme),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightCard(
    String label,
    String value,
    IconData icon,
    ColorScheme colorScheme,
    Color accentColor,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: accentColor.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: accentColor.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: accentColor, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: accentColor,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  List<Widget> _buildSectorBars(Map<String, int> sectors, ColorScheme colorScheme) {
    if (sectors.isEmpty) return [const Text('No sector data')];
    
    final total = sectors.values.reduce((a, b) => a + b);
    final sortedSectors = sectors.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.red,
    ];
    
    return sortedSectors.asMap().entries.map((entry) {
      final index = entry.key;
      final sector = entry.value;
      final percentage = (sector.value / total * 100);
      final color = colors[index % colors.length];
      
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  sector.key,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  '${sector.value} (${percentage.toStringAsFixed(1)}%)',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: percentage / 100,
                minHeight: 6,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
          ],
        ),
      );
    }).toList();
  }

  Widget _buildSortBar(ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          Text(
            'Sort by:',
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildSortChip('Market Cap', 'market_cap', colorScheme),
                  const SizedBox(width: 8),
                  _buildSortChip('P/E Ratio', 'pe_ratio', colorScheme),
                  const SizedBox(width: 8),
                  _buildSortChip('PEG Ratio', 'peg_ratio', colorScheme),
                ],
              ),
            ),
          ),
          IconButton(
            icon: Icon(
              _sortAscending ? Icons.arrow_upward : Icons.arrow_downward,
              color: colorScheme.primary,
            ),
            onPressed: () {
              setState(() {
                _sortAscending = !_sortAscending;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSortChip(String label, String value, ColorScheme colorScheme) {
    final isSelected = _sortBy == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _sortBy = value;
        });
      },
      selectedColor: colorScheme.primaryContainer,
      checkmarkColor: colorScheme.primary,
    );
  }

  Widget _buildResultsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _sortedResults.length,
      itemBuilder: (context, index) {
        return FadeTransition(
          opacity: Tween<double>(begin: 0, end: 1).animate(
            CurvedAnimation(
              parent: _animationController,
              curve: Interval(
                (index / _sortedResults.length) * 0.5,
                ((index + 1) / _sortedResults.length) * 0.5 + 0.5,
                curve: Curves.easeOut,
              ),
            ),
          ),
          child: _buildStockCard(_sortedResults[index], index),
        );
      },
    );
  }

  Widget _buildStockCard(dynamic stock, int index) {
    final symbol = stock['symbol'] ?? 'N/A';
    final name = stock['name'] ?? 'Unknown';
    final sector = stock['sector'] ?? 'N/A';
    final peRatio = _parseDouble(stock['pe_ratio']);
    final pegRatio = _parseDouble(stock['peg_ratio']);
    final debtToFcf = _parseDouble(stock['debt_to_fcf']);
    final marketCap = _parseDouble(stock['market_cap']);
    final revenueGrowth = _parseDouble(stock['revenue_growth']);
    final colorScheme = Theme.of(context).colorScheme;
    
    final stockModel = Stock.fromJson(stock);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white,
            AppColors.surfaceVariant.withOpacity(0.3),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => StockDetailScreen(stock: stockModel),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        symbol,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              FaIcon(FontAwesomeIcons.building, size: 12, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text(
                                sector,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    FutureBuilder<bool>(
                      future: WatchlistService.isInWatchlist(symbol),
                      builder: (context, snapshot) {
                        final isInWatchlist = snapshot.data ?? false;
                        return IconButton(
                          icon: FaIcon(
                            isInWatchlist ? FontAwesomeIcons.solidStar : FontAwesomeIcons.star,
                            color: isInWatchlist ? AppColors.accentOrange : Colors.grey,
                            size: 20,
                          ),
                          onPressed: () async {
                            await WatchlistService.toggleWatchlist(symbol);
                            setState(() {}); // Refresh UI
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  isInWatchlist
                                      ? 'Removed from watchlist'
                                      : 'Added to watchlist',
                                ),
                                duration: const Duration(seconds: 1),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Metrics Grid
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceVariant.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _buildMetricItem(
                              'P/E Ratio',
                              peRatio > 0 ? peRatio.toStringAsFixed(2) : 'N/A',
                              Icons.analytics,
                            ),
                          ),
                          Expanded(
                            child: _buildMetricItem(
                              'PEG Ratio',
                              pegRatio > 0 ? pegRatio.toStringAsFixed(2) : 'N/A',
                              Icons.trending_up,
                            ),
                          ),
                          Expanded(
                            child: _buildMetricItem(
                              'Debt/FCF',
                              debtToFcf > 0 ? debtToFcf.toStringAsFixed(2) : 'N/A',
                              Icons.account_balance,
                            ),
                          ),
                        ],
                      ),
                      if (marketCap > 0 || revenueGrowth > 0) ...[
                        const Divider(height: 24),
                        Row(
                          children: [
                            if (marketCap > 0)
                              Expanded(
                                child: _buildMetricItem(
                                  'Market Cap',
                                  _formatMarketCap(marketCap),
                                  Icons.bar_chart,
                                ),
                              ),
                            if (revenueGrowth > 0)
                              Expanded(
                                child: _buildMetricItem(
                                  'Revenue Growth',
                                  '${revenueGrowth.toStringAsFixed(1)}%',
                                  Icons.show_chart,
                                ),
                              ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: Colors.grey.shade600),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: colorScheme.surfaceVariant.withOpacity(0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.search_off,
              size: 64,
              color: colorScheme.primary.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No stocks found',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          Text(
            'Try adjusting your search criteria',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Use realistic PE values like below 30',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade500,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  String _formatMarketCap(dynamic marketCap) {
    if (marketCap == null) return 'N/A';

    final value = marketCap is num ? marketCap : double.tryParse(marketCap.toString());
    if (value == null) return 'N/A';

    if (value >= 1e12) {
      return '\$${(value / 1e12).toStringAsFixed(2)}T';
    } else if (value >= 1e9) {
      return '\$${(value / 1e9).toStringAsFixed(2)}B';
    } else if (value >= 1e6) {
      return '\$${(value / 1e6).toStringAsFixed(2)}M';
    } else {
      return '\$${value.toStringAsFixed(0)}';
    }
  }
}
