import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';
import '../services/market_data_service.dart';
import '../services/watchlist_api_service.dart';
import '../widgets/auth_sheet.dart';

class StockDetailScreen extends StatefulWidget {
  final String symbol;
  final dynamic stockData;

  const StockDetailScreen({
    super.key,
    required this.symbol,
    required this.stockData,
  });

  @override
  State<StockDetailScreen> createState() => _StockDetailScreenState();
}

class _StockDetailScreenState extends State<StockDetailScreen> {
  final ApiService _apiService = ApiService();
  final WatchlistApiService _watchlistApiService = WatchlistApiService();
  String _selectedTimeframe = '1D';
  bool _chartLoading = true;
  bool _watchlistLoading = false;
  bool _isWatchlisted = false;
  String? _chartError;
  List<CandlePoint> _candles = [];

  @override
  void initState() {
    super.initState();
    AuthService.instance.addListener(_handleAuthChanged);
    _loadCandles();
    _loadWatchlistStatus();
  }

  @override
  void dispose() {
    AuthService.instance.removeListener(_handleAuthChanged);
    super.dispose();
  }

  void _handleAuthChanged() {
    _loadWatchlistStatus();
  }

  Future<void> _loadWatchlistStatus() async {
    final userId = AuthService.instance.currentUserId;
    if (userId == null) {
      if (!mounted) return;
      setState(() => _isWatchlisted = false);
      return;
    }

    final isInWatchlist = await _watchlistApiService.isInWatchlist(
      userId,
      widget.symbol,
    );
    if (!mounted) return;
    setState(() => _isWatchlisted = isInWatchlist);
  }

  Future<bool> _ensureAuthenticated() async {
    if (AuthService.instance.isAuthenticated) return true;
    final loggedIn = await showAuthSheet(context);
    if (!mounted) return false;
    if (!loggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Login is required for this action.'),
          backgroundColor: PremiumColors.warning,
        ),
      );
    }
    return loggedIn;
  }

  Future<void> _toggleWatchlist() async {
    final canProceed = await _ensureAuthenticated();
    if (!canProceed) return;

    final userId = AuthService.instance.currentUserId;
    if (userId == null) return;

    setState(() => _watchlistLoading = true);
    try {
      final updatedState = await _watchlistApiService.toggleWatchlist(
        userId,
        widget.symbol,
      );
      if (!mounted) return;

      setState(() {
        _isWatchlisted = updatedState;
        _watchlistLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            updatedState
                ? '${widget.symbol} added to watchlist.'
                : '${widget.symbol} removed from watchlist.',
          ),
          backgroundColor: updatedState
              ? PremiumColors.profit
              : PremiumColors.loss,
        ),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _watchlistLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unable to update watchlist right now.'),
          backgroundColor: PremiumColors.loss,
        ),
      );
    }
  }

  Future<void> _loadCandles() async {
    setState(() {
      _chartLoading = true;
      _chartError = null;
    });

    try {
      final raw = await MarketDataService.getCandles(
        widget.symbol,
        timeframe: _selectedTimeframe,
      );

      final candles = raw
          .map((c) {
            final time =
                DateTime.tryParse(c['t']?.toString() ?? '') ?? DateTime.now();
            return CandlePoint(
              time: time,
              open: (c['o'] as num?)?.toDouble() ?? 0.0,
              high: (c['h'] as num?)?.toDouble() ?? 0.0,
              low: (c['l'] as num?)?.toDouble() ?? 0.0,
              close: (c['c'] as num?)?.toDouble() ?? 0.0,
              volume: (c['v'] as num?)?.toDouble() ?? 0.0,
            );
          })
          .where((c) => c.close > 0)
          .toList();

      candles.sort((a, b) => a.time.compareTo(b.time));

      if (mounted) {
        setState(() {
          _candles = candles;
          _chartLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _chartError = 'Failed to load chart data';
          _chartLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentPrice = _toDouble(
      _stockValue('currentPrice', fallbackKey: 'current_price'),
    );
    final previousClose = _toDouble(
      _stockValue('previousClose', fallbackKey: 'previous_close'),
      fallback: currentPrice,
    );
    final change = currentPrice - previousClose;
    final changePercent = previousClose != 0
        ? ((change / previousClose) * 100)
        : 0.0;
    final isPositive = change >= 0;
    final changeColor = isPositive ? PremiumColors.profit : PremiumColors.loss;

    return Scaffold(
      backgroundColor: PremiumColors.deepDark,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: PremiumColors.deepDark,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
              title: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.symbol,
                    style: PremiumTypography.h2.copyWith(fontSize: 20),
                  ),
                  Text(
                    _companyName(widget.stockData),
                    style: PremiumTypography.caption.copyWith(fontSize: 10),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: _watchlistLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(
                        _isWatchlisted
                            ? Icons.bookmark_rounded
                            : Icons.bookmark_border_rounded,
                      ),
                onPressed: _watchlistLoading ? null : _toggleWatchlist,
              ),
              IconButton(
                icon: const Icon(Icons.share_rounded),
                onPressed: () {
                  // TODO: Share functionality
                },
              ),
            ],
          ),

          // Price Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '₹${currentPrice.toStringAsFixed(2)}',
                        style: PremiumTypography.priceLarge,
                      ),
                      const SizedBox(width: PremiumUI.spacingM),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: PremiumUI.spacingM,
                          vertical: PremiumUI.spacingS,
                        ),
                        decoration: BoxDecoration(
                          color: changeColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(
                            PremiumUI.radiusM,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isPositive
                                  ? Icons.arrow_upward
                                  : Icons.arrow_downward,
                              size: 16,
                              color: changeColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${change.toStringAsFixed(2)} (${changePercent.toStringAsFixed(2)}%)',
                              style: PremiumTypography.body2.copyWith(
                                color: changeColor,
                                fontWeight: FontWeight.w600,
                                fontFamily: PremiumTypography.numericFont,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: PremiumUI.spacingS),
                  Text(
                    'Previous Close: ₹${previousClose.toStringAsFixed(2)}',
                    style: PremiumTypography.caption,
                  ),
                ],
              ),
            ),
          ),

          // Chart Timeframe Selector
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: PremiumUI.spacingL,
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['1D', '1W', '1M', '3M', '1Y', '5Y'].map((
                    timeframe,
                  ) {
                    final isSelected = _selectedTimeframe == timeframe;
                    return Padding(
                      padding: const EdgeInsets.only(right: PremiumUI.spacingS),
                      child: GestureDetector(
                        onTap: () {
                          setState(() => _selectedTimeframe = timeframe);
                          _loadCandles();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: PremiumUI.spacingM,
                            vertical: PremiumUI.spacingS,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? PremiumColors.neonTeal
                                : PremiumColors.surfaceBg,
                            borderRadius: BorderRadius.circular(
                              PremiumUI.radiusM,
                            ),
                          ),
                          child: Text(
                            timeframe,
                            style: PremiumTypography.body2.copyWith(
                              color: isSelected
                                  ? PremiumColors.textOnAccent
                                  : PremiumColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ),

          // Chart
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              child: PremiumCard(
                padding: const EdgeInsets.all(PremiumUI.spacingM),
                child: SizedBox(height: 300, child: _buildChart()),
              ),
            ),
          ),

          // Key Metrics
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: PremiumUI.spacingL,
              ),
              child: Text('Key Metrics', style: PremiumTypography.h3),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(PremiumUI.spacingL),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: PremiumUI.spacingM,
                mainAxisSpacing: PremiumUI.spacingM,
                childAspectRatio: 1.5,
              ),
              delegate: SliverChildListDelegate([
                _buildMetricCard(
                  'Market Cap',
                  _formatMarketCap(
                    _stockValue('marketCap', fallbackKey: 'market_cap'),
                  ),
                  Icons.business_rounded,
                ),
                _buildMetricCard(
                  'P/E Ratio',
                  _formatOptionalFixed(
                    _stockValue('peRatio', fallbackKey: 'pe_ratio'),
                  ),
                  Icons.analytics_rounded,
                ),
                _buildMetricCard(
                  'ROE',
                  _formatOptionalPercent(
                    _stockValue('roe', fallbackKey: 'return_on_equity'),
                  ),
                  Icons.trending_up_rounded,
                ),
                _buildMetricCard(
                  'Debt/Equity',
                  _formatOptionalFixed(
                    _stockValue('debtToEquity', fallbackKey: 'debt_to_equity'),
                  ),
                  Icons.account_balance_wallet_rounded,
                ),
                _buildMetricCard(
                  'Sector',
                  _displaySector(_stockValue('sector')),
                  Icons.category_rounded,
                ),
                _buildMetricCard(
                  'Volume',
                  _formatVolume(_stockValue('volume')),
                  Icons.bar_chart_rounded,
                ),
              ]),
            ),
          ),

          // Fundamentals Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: PremiumUI.spacingL,
              ),
              child: Text('Fundamentals', style: PremiumTypography.h3),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              child: PremiumCard(
                padding: const EdgeInsets.all(PremiumUI.spacingL),
                child: Column(
                  children: [
                    _buildFundamentalRow('Revenue', _stockValue('revenue')),
                    const Divider(height: 24),
                    _buildFundamentalRow(
                      'Net Profit',
                      _stockValue('netProfit', fallbackKey: 'net_profit'),
                    ),
                    const Divider(height: 24),
                    _buildFundamentalRow('EBITDA', _stockValue('ebitda')),
                    const Divider(height: 24),
                    _buildFundamentalRow('EPS', _stockValue('eps')),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Padding
          const SliverToBoxAdapter(
            child: SizedBox(height: PremiumUI.spacingXL),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(PremiumUI.spacingL),
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _showAddToPortfolioDialog,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: PremiumColors.neonTeal,
                    padding: const EdgeInsets.symmetric(
                      vertical: PremiumUI.spacingM,
                    ),
                  ),
                  child: const Text('Add to Portfolio'),
                ),
              ),
              const SizedBox(width: PremiumUI.spacingM),
              Expanded(
                child: OutlinedButton(
                  onPressed: _showCreateAlertDialog,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(
                      color: PremiumColors.neonTeal,
                      width: 2,
                    ),
                    padding: const EdgeInsets.symmetric(
                      vertical: PremiumUI.spacingM,
                    ),
                  ),
                  child: const Text(
                    'Set Alert',
                    style: TextStyle(color: PremiumColors.neonTeal),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChart() {
    if (_chartLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_chartError != null) {
      return Center(
        child: Text(_chartError!, style: PremiumTypography.caption),
      );
    }

    if (_candles.isEmpty) {
      return const Center(child: Text('No chart data'));
    }

    final minY = _candles.map((e) => e.low).reduce((a, b) => a < b ? a : b);
    final maxY = _candles.map((e) => e.high).reduce((a, b) => a > b ? a : b);
    final padding = (maxY - minY) * 0.1;

    final closeColor = PremiumColors.neonTeal;
    final highColor = PremiumColors.profit.withOpacity(0.6);
    final lowColor = PremiumColors.loss.withOpacity(0.6);

    return Column(
      children: [
        Expanded(
          child: LineChart(
            LineChartData(
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: (maxY - minY) / 4,
                getDrawingHorizontalLine: (value) {
                  return FlLine(
                    color: Colors.white.withOpacity(0.05),
                    strokeWidth: 1,
                  );
                },
              ),
              titlesData: FlTitlesData(
                show: true,
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 50,
                    getTitlesWidget: (value, meta) {
                      return Text(
                        '₹${value.toStringAsFixed(0)}',
                        style: PremiumTypography.caption.copyWith(
                          fontSize: 10,
                          color: PremiumColors.textSecondary,
                        ),
                      );
                    },
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 30,
                    interval: _candles.length / 4,
                    getTitlesWidget: (value, meta) {
                      final index = value.toInt();
                      if (index < 0 || index >= _candles.length)
                        return const SizedBox.shrink();
                      final time = _candles[index].time;
                      return Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          _formatAxisTime(time),
                          style: PremiumTypography.caption.copyWith(
                            fontSize: 10,
                            color: PremiumColors.textSecondary,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              minX: 0,
              maxX: (_candles.length - 1).toDouble(),
              minY: minY - padding,
              maxY: maxY + padding,
              lineBarsData: [
                LineChartBarData(
                  spots: _candles.asMap().entries.map((e) {
                    return FlSpot(e.key.toDouble(), e.value.close);
                  }).toList(),
                  isCurved: true,
                  color: closeColor,
                  barWidth: 3,
                  isStrokeCapRound: true,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      colors: [
                        closeColor.withOpacity(0.3),
                        closeColor.withOpacity(0.0),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
                LineChartBarData(
                  spots: _candles.asMap().entries.map((e) {
                    return FlSpot(e.key.toDouble(), e.value.high);
                  }).toList(),
                  isCurved: true,
                  color: highColor,
                  barWidth: 1.5,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(show: false),
                ),
                LineChartBarData(
                  spots: _candles.asMap().entries.map((e) {
                    return FlSpot(e.key.toDouble(), e.value.low);
                  }).toList(),
                  isCurved: true,
                  color: lowColor,
                  barWidth: 1.5,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(show: false),
                ),
              ],
              lineTouchData: LineTouchData(
                touchTooltipData: LineTouchTooltipData(
                  getTooltipColor: (touchedSpot) => PremiumColors.cardBg,
                  tooltipRoundedRadius: 8,
                  getTooltipItems: (touchedSpots) {
                    return touchedSpots.map((spot) {
                      final time = _candles[spot.x.toInt()].time;
                      return LineTooltipItem(
                        '₹${spot.y.toStringAsFixed(2)}\n${DateFormat('HH:mm').format(time)}',
                        PremiumTypography.caption.copyWith(
                          color: PremiumColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      );
                    }).toList();
                  },
                ),
                handleBuiltInTouches: true,
              ),
            ),
          ),
        ),
        const SizedBox(height: PremiumUI.spacingM),
        SizedBox(height: 80, child: _buildVolumeChart()),
      ],
    );
  }

  Widget _buildVolumeChart() {
    final maxVolume = _candles
        .map((e) => e.volume)
        .reduce((a, b) => a > b ? a : b);

    return BarChart(
      BarChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        minY: 0,
        maxY: maxVolume * 1.1,
        barGroups: _candles.asMap().entries.map((entry) {
          return BarChartGroupData(
            x: entry.key,
            barRods: [
              BarChartRodData(
                toY: entry.value.volume,
                color: PremiumColors.neonTeal.withOpacity(0.6),
                width: 4,
                borderRadius: BorderRadius.circular(2),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }

  String _formatAxisTime(DateTime time) {
    switch (_selectedTimeframe) {
      case '1D':
        return DateFormat('HH:mm').format(time);
      case '1W':
        return DateFormat('EEE').format(time);
      case '1M':
      case '3M':
        return DateFormat('MMM d').format(time);
      case '1Y':
      case '5Y':
        return DateFormat('MMM yy').format(time);
      default:
        return DateFormat('MMM d').format(time);
    }
  }

  Widget _buildMetricCard(String label, String value, IconData icon) {
    return PremiumCard(
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: PremiumColors.neonTeal, size: PremiumUI.iconL),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: PremiumTypography.caption),
              const SizedBox(height: 4),
              Text(
                value,
                style: PremiumTypography.body1.copyWith(
                  fontWeight: FontWeight.w600,
                  fontFamily: value.contains('%') || value.contains('₹')
                      ? PremiumTypography.numericFont
                      : PremiumTypography.primaryFont,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFundamentalRow(String label, dynamic value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: PremiumTypography.body2),
        Text(
          value != null ? _formatCurrency(value) : 'Not Available',
          style: PremiumTypography.body1.copyWith(
            fontWeight: FontWeight.w600,
            fontFamily: PremiumTypography.numericFont,
          ),
        ),
      ],
    );
  }

  String _formatMarketCap(dynamic value) {
    if (value == null) return 'Not Available';
    final number = value is double || value is int
        ? value
        : double.tryParse(value.toString()) ?? 0;
    if (number >= 10000) {
      return '₹${(number / 10000).toStringAsFixed(2)}T';
    } else if (number >= 100) {
      return '₹${(number / 100).toStringAsFixed(2)}B';
    } else {
      return '₹${number.toStringAsFixed(2)}Cr';
    }
  }

  String _formatVolume(dynamic value) {
    if (value == null) return 'Not Available';
    final number = value is double || value is int
        ? value
        : double.tryParse(value.toString()) ?? 0;
    if (number >= 10000000) {
      return '${(number / 10000000).toStringAsFixed(2)}Cr';
    } else if (number >= 100000) {
      return '${(number / 100000).toStringAsFixed(2)}L';
    } else {
      return number.toStringAsFixed(0);
    }
  }

  String _formatCurrency(dynamic value) {
    if (value == null) return 'Not Available';
    final number = value is double || value is int
        ? value
        : double.tryParse(value.toString()) ?? 0;
    if (number >= 10000) {
      return '₹${(number / 10000).toStringAsFixed(2)}T';
    } else if (number >= 100) {
      return '₹${(number / 100).toStringAsFixed(2)}B';
    } else {
      return '₹${number.toStringAsFixed(2)}Cr';
    }
  }

  double _toDouble(dynamic value, {double fallback = 0.0}) {
    final parsed = _tryParseDouble(value);
    return parsed ?? fallback;
  }

  String _formatOptionalFixed(
    dynamic value, {
    int fractionDigits = 2,
    String fallback = 'Not Available',
  }) {
    final parsed = _tryParseDouble(value);
    if (parsed == null) return fallback;
    return parsed.toStringAsFixed(fractionDigits);
  }

  String _formatOptionalPercent(
    dynamic value, {
    int fractionDigits = 2,
    String fallback = 'Not Available',
  }) {
    final parsed = _tryParseDouble(value);
    if (parsed == null) return fallback;
    return '${parsed.toStringAsFixed(fractionDigits)}%';
  }

  double? _tryParseDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    if (value is String) {
      final normalized = value.replaceAll(',', '').trim();
      if (normalized.isEmpty) return null;
      return double.tryParse(normalized);
    }
    return null;
  }

  String _companyName(dynamic stock) {
    final name =
        stock['companyName']?.toString().trim() ??
        stock['company_name']?.toString().trim() ??
        stock['name']?.toString().trim() ??
        '';
    return name.isEmpty ? 'Not Available' : name;
  }

  String _displaySector(dynamic value) {
    final raw = value?.toString().trim() ?? '';
    if (raw.isEmpty) return 'Not Available';

    final normalized = raw.toLowerCase();
    if (normalized == 'unknown' ||
        normalized == 'n/a' ||
        normalized == 'na' ||
        normalized == 'null' ||
        normalized == 'none' ||
        normalized == 'unspecified' ||
        normalized == 'not available') {
      return 'Not Available';
    }

    return raw;
  }

  dynamic _stockValue(String key, {String? fallbackKey}) {
    final primary = widget.stockData[key];
    if (primary != null) return primary;
    if (fallbackKey != null) return widget.stockData[fallbackKey];
    return null;
  }

  Future<void> _showAddToPortfolioDialog() async {
    final canProceed = await _ensureAuthenticated();
    if (!canProceed) return;
    final userId = AuthService.instance.currentUserId;
    if (userId == null) return;

    final quantityController = TextEditingController(text: '1');
    final avgPriceController = TextEditingController(
      text: _toDouble(
        _stockValue('currentPrice', fallbackKey: 'current_price'),
      ).toStringAsFixed(2),
    );

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add To Portfolio'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: quantityController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(labelText: 'Quantity'),
            ),
            const SizedBox(height: PremiumUI.spacingM),
            TextField(
              controller: avgPriceController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(labelText: 'Average Price'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final quantity = _tryParseDouble(quantityController.text);
    final avgPrice = _tryParseDouble(avgPriceController.text);
    if (quantity == null ||
        avgPrice == null ||
        quantity <= 0 ||
        avgPrice <= 0) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter valid quantity and price.')),
      );
      return;
    }

    final success = await _apiService.addToPortfolio(
      userId: userId,
      symbol: widget.symbol,
      quantity: quantity,
      avgPrice: avgPrice,
    );

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success != null
              ? 'Added ${widget.symbol} to portfolio.'
              : 'Failed to add position.',
        ),
        backgroundColor: success != null
            ? PremiumColors.profit
            : PremiumColors.loss,
      ),
    );
  }

  Future<void> _showCreateAlertDialog() async {
    final canProceed = await _ensureAuthenticated();
    if (!canProceed) return;
    final userId = AuthService.instance.currentUserId;
    if (userId == null) return;

    final targetPriceController = TextEditingController(
      text: _toDouble(
        _stockValue('currentPrice', fallbackKey: 'current_price'),
      ).toStringAsFixed(2),
    );
    String selectedType = 'price_above';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          title: const Text('Create Alert'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedType,
                decoration: const InputDecoration(labelText: 'Condition'),
                items: const [
                  DropdownMenuItem(
                    value: 'price_above',
                    child: Text('Price above target'),
                  ),
                  DropdownMenuItem(
                    value: 'price_below',
                    child: Text('Price below target'),
                  ),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setModalState(() => selectedType = value);
                  }
                },
              ),
              const SizedBox(height: PremiumUI.spacingM),
              TextField(
                controller: targetPriceController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(labelText: 'Target Price'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true) return;
    final targetPrice = _tryParseDouble(targetPriceController.text);
    if (targetPrice == null || targetPrice <= 0) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid target price.')),
      );
      return;
    }

    final created = await _apiService.createAlert(
      userId: userId,
      symbol: widget.symbol,
      alertType: selectedType,
      targetPrice: targetPrice,
      severity: 'medium',
    );

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          created
              ? 'Alert created for ${widget.symbol}.'
              : 'Could not create alert.',
        ),
        backgroundColor: created ? PremiumColors.profit : PremiumColors.loss,
      ),
    );
  }
}

class CandlePoint {
  final DateTime time;
  final double open;
  final double high;
  final double low;
  final double close;
  final double volume;

  CandlePoint({
    required this.time,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });
}
