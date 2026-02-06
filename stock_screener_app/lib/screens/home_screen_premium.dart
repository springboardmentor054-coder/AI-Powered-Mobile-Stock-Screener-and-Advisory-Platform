import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';
import 'result_screen_premium.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _queryController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _isServerHealthy = false;
  late AnimationController _animationController;

  final List<Map<String, dynamic>> _quickScreens = [
    {
      'title': 'Value Gems',
      'query': 'Show IT stocks with PE below 25',
      'icon': Icons.diamond_rounded,
      'gradient': PremiumColors.primaryGradient,
    },
    {
      'title': 'Finance Leaders',
      'query': 'Finance stocks with PE below 20 and high ROE',
      'icon': Icons.account_balance_rounded,
      'gradient': PremiumColors.purpleGradient,
    },
    {
      'title': 'Low Debt Champions',
      'query': 'Healthcare stocks with low debt to FCF',
      'icon': Icons.trending_up_rounded,
      'gradient': PremiumColors.profitGradient,
    },
    {
      'title': 'High Growth',
      'query': 'IT stocks with revenue growth above 20%',
      'icon': Icons.rocket_launch_rounded,
      'gradient': LinearGradient(
        colors: [PremiumColors.electricBlue, PremiumColors.neonTeal],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    },
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _animationController.forward();
    _checkServerHealth();
  }

  Future<void> _checkServerHealth() async {
    try {
      final isHealthy = await ApiService().checkHealth();
      if (mounted) {
        setState(() {
          _isServerHealthy = isHealthy;
          if (!isHealthy) {
            _errorMessage = 'Backend offline. Start server to continue.';
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isServerHealthy = false;
          _errorMessage = 'Cannot connect to backend server';
        });
      }
    }
  }

  @override
  void dispose() {
    _queryController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _searchStocks({String? predefinedQuery}) async {
    final query = predefinedQuery ?? _queryController.text.trim();

    if (query.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter a search query';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await ApiService().fetchStocks(query);

      if (!mounted) return;

      if (results.isEmpty) {
        setState(() {
          _errorMessage = 'No stocks found for your query';
          _isLoading = false;
        });
        return;
      }

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ResultScreen(
            results: results,
            query: query,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      
      setState(() {
        _errorMessage = 'Error: ${e.toString().replaceAll('Exception: ', '')}';
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to search: $e'),
          backgroundColor: Colors.red.shade700,
          action: SnackBarAction(
            label: 'Retry',
            textColor: Colors.white,
            onPressed: () => _searchStocks(predefinedQuery: predefinedQuery),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PremiumColors.deepDark,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // App Bar
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
                            Icons.search_rounded,
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
                                'Smart Screener',
                                style: PremiumTypography.h1,
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: _isServerHealthy
                                          ? PremiumColors.profit
                                          : PremiumColors.loss,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: (_isServerHealthy
                                                  ? PremiumColors.profit
                                                  : PremiumColors.loss)
                                              .withOpacity(0.5),
                                          blurRadius: 8,
                                          spreadRadius: 2,
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: PremiumUI.spacingS),
                                  Text(
                                    _isServerHealthy ? 'Live' : 'Offline',
                                    style: PremiumTypography.caption.copyWith(
                                      color: _isServerHealthy
                                          ? PremiumColors.profit
                                          : PremiumColors.loss,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Search Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
                child: Column(
                  children: [
                    PremiumCard(
                      padding: const EdgeInsets.all(4),
                      child: TextField(
                        controller: _queryController,
                        style: PremiumTypography.body1,
                        decoration: InputDecoration(
                          hintText: 'Ask anything... "PE below 20", "high ROE stocks"',
                          hintStyle: PremiumTypography.body2,
                          prefixIcon: const Icon(
                            Icons.auto_awesome_rounded,
                            color: PremiumColors.neonTeal,
                          ),
                          suffixIcon: _isLoading
                              ? const Padding(
                                  padding: EdgeInsets.all(12.0),
                                  child: SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        PremiumColors.neonTeal,
                                      ),
                                    ),
                                  ),
                                )
                              : IconButton(
                                  icon: const Icon(
                                    Icons.arrow_forward_rounded,
                                    color: PremiumColors.neonTeal,
                                  ),
                                  onPressed: _isServerHealthy ? _searchStocks : null,
                                ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: PremiumUI.spacingM,
                            vertical: PremiumUI.spacingM,
                          ),
                        ),
                        onSubmitted: _isServerHealthy ? (_) => _searchStocks() : null,
                      ),
                    ),
                    
                    // Error Message
                    if (_errorMessage != null) ...[
                      const SizedBox(height: PremiumUI.spacingM),
                      Container(
                        padding: const EdgeInsets.all(PremiumUI.spacingM),
                        decoration: BoxDecoration(
                          color: PremiumColors.loss.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(PremiumUI.radiusL),
                          border: Border.all(
                            color: PremiumColors.loss.withOpacity(0.3),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline_rounded,
                              color: PremiumColors.loss,
                              size: PremiumUI.iconM,
                            ),
                            const SizedBox(width: PremiumUI.spacingM),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: PremiumTypography.body2.copyWith(
                                  color: PremiumColors.loss,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Quick Screens
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(
                  top: PremiumUI.spacingXL,
                  left: PremiumUI.spacingL,
                  right: PremiumUI.spacingL,
                ),
                child: Text(
                  'Quick Screens',
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
                  childAspectRatio: 1.1,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final screen = _quickScreens[index];
                    return _buildQuickScreenCard(
                      title: screen['title'],
                      query: screen['query'],
                      icon: screen['icon'],
                      gradient: screen['gradient'],
                    );
                  },
                  childCount: _quickScreens.length,
                ),
              ),
            ),

            // Popular Filters
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
                child: Text(
                  'Popular Filters',
                  style: PremiumTypography.h3,
                ),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _buildFilterChip('PE Ratio < 20', 'Show stocks with PE below 20'),
                  const SizedBox(height: PremiumUI.spacingM),
                  _buildFilterChip('High ROE > 15%', 'Stocks with ROE above 15%'),
                  const SizedBox(height: PremiumUI.spacingM),
                  _buildFilterChip('Low Debt-to-Equity', 'Stocks with debt to equity below 0.5'),
                  const SizedBox(height: PremiumUI.spacingM),
                  _buildFilterChip('Market Cap > 1000 Cr', 'Large cap stocks above 1000 crores'),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickScreenCard({
    required String title,
    required String query,
    required IconData icon,
    required Gradient gradient,
  }) {
    return PremiumCard(
      onTap: _isServerHealthy ? () => _searchStocks(predefinedQuery: query) : null,
      padding: EdgeInsets.zero,
      child: Container(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(PremiumUI.radiusXL),
        ),
        child: Padding(
          padding: const EdgeInsets.all(PremiumUI.spacingM),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(PremiumUI.spacingS),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(PremiumUI.radiusM),
                ),
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(height: PremiumUI.spacingM),
              Flexible(
                child: Text(
                  title,
                  style: PremiumTypography.h3.copyWith(
                    fontSize: 14,
                    color: Colors.white,
                    height: 1.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: PremiumUI.spacingS),
              Icon(
                Icons.arrow_forward_rounded,
                color: Colors.white.withOpacity(0.8),
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String title, String query) {
    return PremiumCard(
      onTap: _isServerHealthy ? () => _searchStocks(predefinedQuery: query) : null,
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(PremiumUI.spacingS),
            decoration: BoxDecoration(
              color: PremiumColors.neonTeal.withOpacity(0.1),
              borderRadius: BorderRadius.circular(PremiumUI.radiusS),
            ),
            child: const Icon(
              Icons.filter_list_rounded,
              color: PremiumColors.neonTeal,
              size: PremiumUI.iconM,
            ),
          ),
          const SizedBox(width: PremiumUI.spacingM),
          Expanded(
            child: Text(
              title,
              style: PremiumTypography.body1.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Icon(
            Icons.chevron_right_rounded,
            color: PremiumColors.textMuted,
            size: PremiumUI.iconL,
          ),
        ],
      ),
    );
  }
}
