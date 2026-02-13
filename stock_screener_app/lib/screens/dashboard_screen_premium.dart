import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';
import '../widgets/stock_list_tile.dart';

class DashboardScreen extends StatefulWidget {
  final Future<void> Function(int tabIndex)? onNavigateToTab;

  const DashboardScreen({super.key, this.onNavigateToTab});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = true;
  DateTime? _lastUpdatedAt;
  List<dynamic> _trendingStocks = [];
  List<dynamic> _topGainers = [];
  List<dynamic> _topLosers = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);

    try {
      final dashboardData = await ApiService().getDashboardData();
      if (!mounted) return;
      setState(() {
        _trendingStocks = dashboardData['trending'] ?? [];
        _topGainers = dashboardData['topGainers'] ?? [];
        _topLosers = dashboardData['topLosers'] ?? [];
        _isLoading = false;
        _lastUpdatedAt = DateTime.now();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to load dashboard: $e'),
          backgroundColor: Colors.red,
          action: SnackBarAction(
            label: 'Retry',
            textColor: Colors.white,
            onPressed: _loadDashboardData,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFFBE8),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadDashboardData,
          color: PremiumColors.neonTeal,
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  PremiumUI.spacingM,
                  PremiumUI.spacingM,
                  PremiumUI.spacingM,
                  0,
                ),
                sliver: SliverToBoxAdapter(child: _buildHeaderCard()),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  PremiumUI.spacingM,
                  PremiumUI.spacingM,
                  PremiumUI.spacingM,
                  0,
                ),
                sliver: SliverToBoxAdapter(child: _buildSnapshotRow()),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  PremiumUI.spacingM,
                  PremiumUI.spacingM,
                  PremiumUI.spacingM,
                  0,
                ),
                sliver: SliverToBoxAdapter(child: _buildMomentumChart()),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  PremiumUI.spacingM,
                  PremiumUI.spacingL,
                  PremiumUI.spacingM,
                  0,
                ),
                sliver: SliverToBoxAdapter(child: _buildTrendingHeader()),
              ),
              if (_isLoading)
                SliverPadding(
                  padding: const EdgeInsets.all(PremiumUI.spacingM),
                  sliver: SliverToBoxAdapter(
                    child: Column(
                      children: List.generate(
                        3,
                        (_) => const Padding(
                          padding: EdgeInsets.only(bottom: PremiumUI.spacingS),
                          child: ShimmerLoading(child: StockTileSkeleton()),
                        ),
                      ),
                    ),
                  ),
                )
              else if (_trendingStocks.isEmpty)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(PremiumUI.spacingM),
                    child: EmptyState(
                      icon: Icons.insights_rounded,
                      title: 'No dashboard data',
                      subtitle: 'Pull to refresh and try again.',
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    PremiumUI.spacingM,
                    PremiumUI.spacingS,
                    PremiumUI.spacingM,
                    0,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate((context, index) {
                      final stock = _trendingStocks[index];
                      return Padding(
                        padding: const EdgeInsets.only(
                          bottom: PremiumUI.spacingS,
                        ),
                        child: CompactStockTile(
                          symbol: _stockSymbol(stock),
                          companyName: _stockName(stock),
                          price: _asDouble(
                            stock['current_price'] ?? stock['currentPrice'],
                          ),
                          changePercent: _calculateChangePercent(stock),
                        ),
                      );
                    }, childCount: _trendingStocks.length),
                  ),
                ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  PremiumUI.spacingM,
                  PremiumUI.spacingL,
                  PremiumUI.spacingM,
                  0,
                ),
                sliver: SliverToBoxAdapter(
                  child: Text('Quick Actions', style: PremiumTypography.h3),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.all(PremiumUI.spacingM),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: PremiumUI.spacingS,
                    mainAxisSpacing: PremiumUI.spacingS,
                    childAspectRatio: 1.45,
                  ),
                  delegate: SliverChildListDelegate([
                    _buildQuickActionCard(
                      title: 'Watchlist',
                      icon: Icons.bookmark_rounded,
                      gradient: PremiumColors.primaryGradient,
                      onTap: () => widget.onNavigateToTab?.call(1),
                    ),
                    _buildQuickActionCard(
                      title: 'Portfolio',
                      icon: Icons.pie_chart_rounded,
                      gradient: PremiumColors.purpleGradient,
                      onTap: () => widget.onNavigateToTab?.call(3),
                    ),
                    _buildQuickActionCard(
                      title: 'Alerts',
                      icon: Icons.notifications_rounded,
                      gradient: PremiumColors.profitGradient,
                      onTap: () => widget.onNavigateToTab?.call(4),
                    ),
                    _buildQuickActionCard(
                      title: 'Screener',
                      icon: Icons.manage_search_rounded,
                      gradient: const LinearGradient(
                        colors: [Color(0xFF60A5FA), Color(0xFF2563EB)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      onTap: () => widget.onNavigateToTab?.call(0),
                    ),
                  ]),
                ),
              ),
              const SliverToBoxAdapter(
                child: SizedBox(height: PremiumUI.spacingL),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    return PremiumCard(
      backgroundColor: Colors.white,
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: PremiumColors.primaryGradient,
              borderRadius: BorderRadius.circular(PremiumUI.radiusM),
            ),
            child: const Icon(
              Icons.dashboard_rounded,
              color: Colors.white,
              size: PremiumUI.iconM,
            ),
          ),
          const SizedBox(width: PremiumUI.spacingS),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Market Dashboard', style: PremiumTypography.h3),
                Text(
                  _lastUpdatedAt == null
                      ? 'Syncing live data...'
                      : 'Updated ${_formatElapsed(_lastUpdatedAt!)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: PremiumTypography.caption.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadDashboardData,
            tooltip: 'Refresh',
          ),
        ],
      ),
    );
  }

  Widget _buildSnapshotRow() {
    return Row(
      children: [
        Expanded(
          child: _buildSnapshotCard(
            title: 'Trending',
            value: '${_trendingStocks.length}',
            subtitle: 'Live symbols',
            gradient: PremiumColors.primaryGradient,
          ),
        ),
        const SizedBox(width: PremiumUI.spacingS),
        Expanded(
          child: _buildSnapshotCard(
            title: 'Movers',
            value: '${_topGainers.length}/${_topLosers.length}',
            subtitle: 'Up / Down',
            gradient: PremiumColors.purpleGradient,
          ),
        ),
      ],
    );
  }

  Widget _buildSnapshotCard({
    required String title,
    required String value,
    required String subtitle,
    required Gradient gradient,
  }) {
    return PremiumCard(
      gradient: gradient,
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: PremiumTypography.caption.copyWith(
              color: Colors.white.withValues(alpha: 0.9),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: PremiumTypography.priceMedium.copyWith(color: Colors.white),
          ),
          Text(
            subtitle,
            style: PremiumTypography.caption.copyWith(
              color: Colors.white.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrendingHeader() {
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      runSpacing: PremiumUI.spacingS,
      children: [
        Text('Trending Stocks', style: PremiumTypography.h3),
        TextButton(
          onPressed: () => widget.onNavigateToTab?.call(1),
          child: Text(
            'Open Watchlist',
            style: PremiumTypography.body2.copyWith(
              color: PremiumColors.neonTeal,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMomentumChart() {
    final movers = <Map<String, dynamic>>[
      ..._topGainers.whereType<Map<String, dynamic>>().take(3),
      ..._topLosers.whereType<Map<String, dynamic>>().take(3),
    ];

    if (movers.isEmpty) {
      return PremiumCard(
        backgroundColor: Colors.white,
        padding: const EdgeInsets.all(PremiumUI.spacingM),
        child: Text(
          'Momentum chart will appear when movers data is available.',
          style: PremiumTypography.caption,
        ),
      );
    }

    final values = movers
        .map((stock) => _calculateChangePercent(stock))
        .toList();
    final absMax = values
        .map((v) => v.abs())
        .fold<double>(1.0, (max, v) => v > max ? v : max);
    final maxY = (absMax * 1.25).clamp(1.0, 25.0);
    final minY = -maxY;
    final average = values.reduce((a, b) => a + b) / values.length;
    final best = values.reduce((a, b) => a > b ? a : b);
    final worst = values.reduce((a, b) => a < b ? a : b);

    return PremiumCard(
      backgroundColor: Colors.white,
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: PremiumUI.spacingM,
            runSpacing: PremiumUI.spacingS,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text('Market Momentum', style: PremiumTypography.h3),
              _legendDot(PremiumColors.profit, 'Gainers'),
              _legendDot(PremiumColors.loss, 'Losers'),
            ],
          ),
          const SizedBox(height: PremiumUI.spacingS),
          Wrap(
            spacing: PremiumUI.spacingS,
            runSpacing: PremiumUI.spacingS,
            children: [
              _metricChip('Best', '${best.toStringAsFixed(2)}%'),
              _metricChip('Worst', '${worst.toStringAsFixed(2)}%'),
              _metricChip('Avg', '${average.toStringAsFixed(2)}%'),
            ],
          ),
          const SizedBox(height: PremiumUI.spacingM),
          SizedBox(
            height: 210,
            child: BarChart(
              BarChartData(
                minY: minY,
                maxY: maxY,
                alignment: BarChartAlignment.spaceAround,
                gridData: FlGridData(
                  show: true,
                  horizontalInterval: maxY / 4,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) =>
                      FlLine(color: PremiumColors.divider, strokeWidth: 0.8),
                ),
                borderData: FlBorderData(show: false),
                extraLinesData: ExtraLinesData(
                  horizontalLines: [
                    HorizontalLine(
                      y: 0,
                      color: PremiumColors.textMuted.withValues(alpha: 0.35),
                      strokeWidth: 1,
                    ),
                    HorizontalLine(
                      y: average,
                      color: PremiumColors.info.withValues(alpha: 0.45),
                      strokeWidth: 1,
                      dashArray: const [6, 4],
                    ),
                  ],
                ),
                barTouchData: BarTouchData(
                  enabled: true,
                  touchTooltipData: BarTouchTooltipData(
                    tooltipRoundedRadius: 10,
                    getTooltipColor: (_) => PremiumColors.textPrimary,
                    getTooltipItem: (group, groupIndex, rod, _) {
                      final stock = movers[group.x.toInt()];
                      final symbol = _stockSymbol(stock);
                      final shortName = _trimName(_stockName(stock));
                      return BarTooltipItem(
                        '$symbol - $shortName\n${rod.toY.toStringAsFixed(2)}%',
                        PremiumTypography.caption.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 38,
                      interval: maxY / 4,
                      getTitlesWidget: (value, meta) {
                        if (value == 0) {
                          return Text(
                            '0%',
                            style: PremiumTypography.caption.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          );
                        }
                        return Text(
                          '${value.toStringAsFixed(0)}%',
                          style: PremiumTypography.caption,
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx < 0 || idx >= movers.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            _stockSymbol(movers[idx]),
                            style: PremiumTypography.caption,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                barGroups: List.generate(movers.length, (index) {
                  final change = values[index];
                  final color = change >= 0
                      ? PremiumColors.profit
                      : PremiumColors.loss;
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: change,
                        width: 16,
                        borderRadius: BorderRadius.circular(4),
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: change >= 0
                              ? [
                                  color.withValues(alpha: 0.85),
                                  color.withValues(alpha: 0.55),
                                ]
                              : [
                                  color.withValues(alpha: 0.55),
                                  color.withValues(alpha: 0.85),
                                ],
                        ),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard({
    required String title,
    required IconData icon,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return PremiumCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(PremiumUI.radiusL),
        ),
        padding: const EdgeInsets.all(PremiumUI.spacingM),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: PremiumUI.iconL),
            const SizedBox(height: PremiumUI.spacingS),
            Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: PremiumTypography.body2.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: PremiumTypography.caption.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _metricChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: PremiumUI.spacingS,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: PremiumColors.surfaceBg,
        borderRadius: BorderRadius.circular(PremiumUI.radiusS),
        border: Border.all(color: PremiumColors.divider),
      ),
      child: Text(
        '$label $value',
        style: PremiumTypography.caption.copyWith(
          fontWeight: FontWeight.w700,
          color: PremiumColors.textSecondary,
        ),
      ),
    );
  }

  double _calculateChangePercent(dynamic stock) {
    final current = _asDouble(stock['current_price'] ?? stock['currentPrice']);
    final previous = _asDouble(
      stock['previous_close'] ?? stock['previousClose'],
    );
    if (previous == 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  double _asDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  String _stockName(dynamic stock) {
    final name =
        stock['companyName']?.toString().trim() ??
        stock['company_name']?.toString().trim() ??
        stock['name']?.toString().trim() ??
        '';
    return name.isEmpty ? 'Not Available' : name;
  }

  String _stockSymbol(dynamic stock) {
    final symbol = stock['symbol']?.toString().trim() ?? '';
    return symbol.isEmpty ? 'NA' : symbol;
  }

  String _trimName(String name) {
    if (name.length <= 22) return name;
    return '${name.substring(0, 22)}...';
  }

  String _formatElapsed(DateTime value) {
    final diff = DateTime.now().difference(value);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }
}
