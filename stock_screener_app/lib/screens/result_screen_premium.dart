import 'package:flutter/material.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';
import '../widgets/stock_list_tile.dart';
import 'stock_detail_screen_premium.dart';

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

class _ResultScreenState extends State<ResultScreen> {
  String _sortBy = 'symbol'; // symbol, price, changePercent, marketCap
  bool _sortAscending = true;
  String _filterSector = 'All';
  
  List<String> get _sectors {
    final sectors = widget.results
        .map((stock) => stock['sector']?.toString() ?? 'Unknown')
        .toSet()
        .toList();
    sectors.insert(0, 'All');
    return sectors;
  }

  List<dynamic> get _filteredAndSortedResults {
    var filtered = widget.results.where((stock) {
      if (_filterSector == 'All') return true;
      return stock['sector'] == _filterSector;
    }).toList();

    filtered.sort((a, b) {
      dynamic aValue, bValue;
      
      switch (_sortBy) {
        case 'symbol':
          aValue = a['symbol']?.toString() ?? '';
          bValue = b['symbol']?.toString() ?? '';
          break;
        case 'price':
          aValue = a['currentPrice'] ?? 0;
          bValue = b['currentPrice'] ?? 0;
          break;
        case 'changePercent':
          aValue = _calculateChangePercent(a);
          bValue = _calculateChangePercent(b);
          break;
        case 'marketCap':
          aValue = a['marketCap'] ?? 0;
          bValue = b['marketCap'] ?? 0;
          break;
        default:
          return 0;
      }

      final comparison = _sortAscending
          ? (aValue is String
              ? aValue.compareTo(bValue)
              : (aValue as num).compareTo(bValue as num))
          : (aValue is String
              ? bValue.compareTo(aValue)
              : (bValue as num).compareTo(aValue as num));

      return comparison;
    });

    return filtered;
  }

  double _calculateChangePercent(dynamic stock) {
    final current = stock['currentPrice'] ?? 0;
    final previous = stock['previousClose'] ?? current;
    if (previous == 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  @override
  Widget build(BuildContext context) {
    final filteredResults = _filteredAndSortedResults;

    return Scaffold(
      backgroundColor: PremiumColors.deepDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Search Results',
              style: PremiumTypography.h3,
            ),
            Text(
              '${filteredResults.length} stocks found',
              style: PremiumTypography.caption,
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          // Query Display
          Padding(
            padding: const EdgeInsets.all(PremiumUI.spacingL),
            child: PremiumCard(
              useGlass: true,
              padding: const EdgeInsets.all(PremiumUI.spacingM),
              child: Row(
                children: [
                  const Icon(
                    Icons.auto_awesome_rounded,
                    color: PremiumColors.neonTeal,
                    size: PremiumUI.iconM,
                  ),
                  const SizedBox(width: PremiumUI.spacingM),
                  Expanded(
                    child: Text(
                      widget.query,
                      style: PremiumTypography.body2,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Sort & Filter Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: PremiumUI.spacingL),
            child: Row(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip(
                          'Symbol',
                          _sortBy == 'symbol',
                          () => setState(() {
                            if (_sortBy == 'symbol') {
                              _sortAscending = !_sortAscending;
                            } else {
                              _sortBy = 'symbol';
                              _sortAscending = true;
                            }
                          }),
                        ),
                        const SizedBox(width: PremiumUI.spacingS),
                        _buildFilterChip(
                          'Price',
                          _sortBy == 'price',
                          () => setState(() {
                            if (_sortBy == 'price') {
                              _sortAscending = !_sortAscending;
                            } else {
                              _sortBy = 'price';
                              _sortAscending = false;
                            }
                          }),
                        ),
                        const SizedBox(width: PremiumUI.spacingS),
                        _buildFilterChip(
                          'Change %',
                          _sortBy == 'changePercent',
                          () => setState(() {
                            if (_sortBy == 'changePercent') {
                              _sortAscending = !_sortAscending;
                            } else {
                              _sortBy = 'changePercent';
                              _sortAscending = false;
                            }
                          }),
                        ),
                        const SizedBox(width: PremiumUI.spacingS),
                        _buildFilterChip(
                          'Market Cap',
                          _sortBy == 'marketCap',
                          () => setState(() {
                            if (_sortBy == 'marketCap') {
                              _sortAscending = !_sortAscending;
                            } else {
                              _sortBy = 'marketCap';
                              _sortAscending = false;
                            }
                          }),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: PremiumUI.spacingL),

          // Results List
          Expanded(
            child: filteredResults.isEmpty
                ? EmptyState(
                    icon: Icons.search_off_rounded,
                    title: 'No Results',
                    subtitle: 'Try adjusting your search query',
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(
                      horizontal: PremiumUI.spacingL,
                      vertical: PremiumUI.spacingM,
                    ),
                    itemCount: filteredResults.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: PremiumUI.spacingM),
                    itemBuilder: (context, index) {
                      final stock = filteredResults[index];
                      return _buildStockTile(stock);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStockTile(dynamic stock) {
    final symbol = stock['symbol']?.toString() ?? 'N/A';
    final companyName = stock['companyName']?.toString() ?? 'Unknown';
    final currentPrice = stock['currentPrice']?.toDouble() ?? 0.0;
    final previousClose = stock['previousClose']?.toDouble() ?? currentPrice;
    final change = currentPrice - previousClose;
    final changePercent = _calculateChangePercent(stock);
    final sector = stock['sector']?.toString();

    return StockListTile(
      symbol: symbol,
      companyName: companyName,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      sectorTag: sector,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => StockDetailScreen(
              symbol: symbol,
              stockData: stock,
            ),
          ),
        );
      },
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: PremiumUI.spacingM,
          vertical: PremiumUI.spacingS,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? PremiumColors.neonTeal
              : PremiumColors.surfaceBg,
          borderRadius: BorderRadius.circular(PremiumUI.radiusL),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: PremiumTypography.body2.copyWith(
                color: isSelected
                    ? PremiumColors.deepDark
                    : PremiumColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: PremiumUI.spacingXS),
              Icon(
                _sortAscending
                    ? Icons.arrow_upward_rounded
                    : Icons.arrow_downward_rounded,
                size: 14,
                color: PremiumColors.deepDark,
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: PremiumColors.cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(PremiumUI.radiusXL),
        ),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(PremiumUI.spacingL),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: PremiumColors.textMuted,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: PremiumUI.spacingL),
                  Text(
                    'Filter by Sector',
                    style: PremiumTypography.h3,
                  ),
                  const SizedBox(height: PremiumUI.spacingL),
                  Wrap(
                    spacing: PremiumUI.spacingS,
                    runSpacing: PremiumUI.spacingS,
                    children: _sectors.map((sector) {
                      final isSelected = _filterSector == sector;
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _filterSector = sector;
                          });
                          setModalState(() {});
                          Navigator.pop(context);
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
                            borderRadius: BorderRadius.circular(PremiumUI.radiusL),
                          ),
                          child: Text(
                            sector,
                            style: PremiumTypography.body2.copyWith(
                              color: isSelected
                                  ? PremiumColors.deepDark
                                  : PremiumColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: PremiumUI.spacingL),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
