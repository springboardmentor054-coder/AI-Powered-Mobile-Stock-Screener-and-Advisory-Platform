import 'package:flutter/material.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';
import '../widgets/stock_list_tile.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = true;
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
      // Fetch dashboard data using the new comprehensive method
      final dashboardData = await ApiService().getDashboardData();
      
      if (mounted) {
        setState(() {
          _trendingStocks = dashboardData['trending'] ?? [];
          _topGainers = dashboardData['topGainers'] ?? [];
          _topLosers = dashboardData['topLosers'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Dashboard error: $e');
      if (mounted) {
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PremiumColors.deepDark,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadDashboardData,
          color: PremiumColors.neonTeal,
          backgroundColor: PremiumColors.cardBg,
          child: CustomScrollView(
            slivers: [
              // Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(PremiumUI.spacingL),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(PremiumUI.spacingM),
                            decoration: BoxDecoration(
                              gradient: PremiumColors.primaryGradient,
                              borderRadius: BorderRadius.circular(PremiumUI.radiusL),
                            ),
                            child: const Icon(
                              Icons.dashboard_rounded,
                              color: PremiumColors.deepDark,
                              size: PremiumUI.iconL,
                            ),
                          ),
                          const SizedBox(width: PremiumUI.spacingM),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Market Dashboard',
                                  style: PremiumTypography.h1,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Live market insights',
                                  style: PremiumTypography.caption.copyWith(
                                    color: PremiumColors.neonTeal,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.notifications_outlined),
                            onPressed: () {
                              // Navigate to alerts
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Market Stats
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
                  child: Row(
                    children: [
                      Expanded(
                        child: PremiumCard(
                          gradient: PremiumColors.profitGradient,
                          padding: const EdgeInsets.all(PremiumUI.spacingM),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.trending_up_rounded,
                                    color: Colors.white,
                                    size: PremiumUI.iconM,
                                  ),
                                  const SizedBox(width: PremiumUI.spacingS),
                                  Text(
                                    'NIFTY 50',
                                    style: PremiumTypography.caption.copyWith(
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: PremiumUI.spacingS),
                              Text(
                                '24,850',
                                style: PremiumTypography.priceMedium.copyWith(
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                '+2.5%',
                                style: PremiumTypography.caption.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: PremiumUI.spacingM),
                      Expanded(
                        child: PremiumCard(
                          gradient: PremiumColors.purpleGradient,
                          padding: const EdgeInsets.all(PremiumUI.spacingM),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.show_chart_rounded,
                                    color: Colors.white,
                                    size: PremiumUI.iconM,
                                  ),
                                  const SizedBox(width: PremiumUI.spacingS),
                                  Text(
                                    'SENSEX',
                                    style: PremiumTypography.caption.copyWith(
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: PremiumUI.spacingS),
                              Text(
                                '82,450',
                                style: PremiumTypography.priceMedium.copyWith(
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                '+1.8%',
                                style: PremiumTypography.caption.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Trending Stocks
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(
                    top: PremiumUI.spacingXL,
                    left: PremiumUI.spacingL,
                    right: PremiumUI.spacingL,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Trending Stocks',
                        style: PremiumTypography.h3,
                      ),
                      TextButton(
                        onPressed: () {},
                        child: Text(
                          'See All',
                          style: PremiumTypography.body2.copyWith(
                            color: PremiumColors.neonTeal,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              _isLoading
                  ? SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(PremiumUI.spacingL),
                        child: Column(
                          children: List.generate(
                            3,
                            (index) => Padding(
                              padding: const EdgeInsets.only(bottom: PremiumUI.spacingM),
                              child: const ShimmerLoading(
                                child: StockTileSkeleton(),
                              ),
                            ),
                          ),
                        ),
                      ),
                    )
                  : SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            if (_trendingStocks.isEmpty) {
                              return Padding(
                                padding: const EdgeInsets.all(PremiumUI.spacingL),
                                child: EmptyState(
                                  icon: Icons.trending_up_rounded,
                                  title: 'No Trending Stocks',
                                  subtitle: 'Check back later for updates',
                                ),
                              );
                            }
                            
                            final stock = _trendingStocks[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: PremiumUI.spacingM),
                              child: CompactStockTile(
                                symbol: stock['symbol']?.toString() ?? 'N/A',
                                price: stock['currentPrice']?.toDouble() ?? 0.0,
                                changePercent: _calculateChangePercent(stock),
                                onTap: () {
                                  // Navigate to stock detail
                                },
                              ),
                            );
                          },
                          childCount: _trendingStocks.isEmpty ? 1 : _trendingStocks.length,
                        ),
                      ),
                    ),

              // Quick Actions
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(
                    top: PremiumUI.spacingXL,
                    left: PremiumUI.spacingL,
                    right: PremiumUI.spacingL,
                  ),
                  child: Text(
                    'Quick Actions',
                    style: PremiumTypography.h3,
                  ),
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
                    _buildQuickActionCard(
                      'Portfolio',
                      Icons.pie_chart_rounded,
                      PremiumColors.primaryGradient,
                      () {},
                    ),
                    _buildQuickActionCard(
                      'Watchlist',
                      Icons.bookmark_rounded,
                      PremiumColors.purpleGradient,
                      () {},
                    ),
                    _buildQuickActionCard(
                      'Market News',
                      Icons.newspaper_rounded,
                      PremiumColors.profitGradient,
                      () {},
                    ),
                    _buildQuickActionCard(
                      'Analytics',
                      Icons.analytics_rounded,
                      LinearGradient(
                        colors: [PremiumColors.electricBlue, PremiumColors.neonTeal],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      () {},
                    ),
                  ]),
                ),
              ),

              // Bottom Padding
              const SliverToBoxAdapter(
                child: SizedBox(height: PremiumUI.spacingXL),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActionCard(
    String title,
    IconData icon,
    Gradient gradient,
    VoidCallback onTap,
  ) {
    return PremiumCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(PremiumUI.radiusXL),
        ),
        child: Padding(
          padding: const EdgeInsets.all(PremiumUI.spacingL),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(
                icon,
                color: Colors.white,
                size: PremiumUI.iconXL,
              ),
              Text(
                title,
                style: PremiumTypography.h3.copyWith(
                  fontSize: 16,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  double _calculateChangePercent(dynamic stock) {
    final current = stock['currentPrice'] ?? 0;
    final previous = stock['previousClose'] ?? current;
    if (previous == 0) return 0;
    return ((current - previous) / previous) * 100;
  }
}
