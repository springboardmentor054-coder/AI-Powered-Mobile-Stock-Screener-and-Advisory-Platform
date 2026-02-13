import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/premium_theme.dart';
import '../widgets/premium_card.dart';
import '../widgets/stock_list_tile.dart';
import 'stock_detail_screen_premium.dart';

class ResultScreen extends StatefulWidget {
  final List<dynamic> results;
  final String query;

  const ResultScreen({super.key, required this.results, required this.query});

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  static const String _allSectorsLabel = 'All Sectors';
  String _sortBy = 'marketCap'; // symbol, price, changePercent, marketCap
  bool _sortAscending = false;
  String _filterSector = _allSectorsLabel;

  List<String> get _sectors {
    final sectors =
        widget.results
            .map((stock) => _displaySector(stock['sector']))
            .whereType<String>()
            .toSet()
            .toList()
          ..sort();
    sectors.insert(0, _allSectorsLabel);
    return sectors;
  }

  List<dynamic> get _filteredAndSortedResults {
    var filtered = widget.results.where((stock) {
      if (_filterSector == _allSectorsLabel) return true;
      return _displaySector(stock['sector']) == _filterSector;
    }).toList();

    filtered.sort((a, b) {
      if (_sortBy == 'symbol') {
        final aValue = a['symbol']?.toString() ?? '';
        final bValue = b['symbol']?.toString() ?? '';
        return _sortAscending
            ? aValue.compareTo(bValue)
            : bValue.compareTo(aValue);
      }

      double aValue = 0.0;
      double bValue = 0.0;

      switch (_sortBy) {
        case 'price':
          aValue = _toDouble(a['currentPrice']);
          bValue = _toDouble(b['currentPrice']);
          break;
        case 'changePercent':
          aValue = _calculateChangePercent(a);
          bValue = _calculateChangePercent(b);
          break;
        case 'marketCap':
          aValue = _toDouble(a['marketCap']);
          bValue = _toDouble(b['marketCap']);
          break;
        default:
          return 0;
      }

      return _sortAscending
          ? aValue.compareTo(bValue)
          : bValue.compareTo(aValue);
    });

    return filtered;
  }

  double _calculateChangePercent(dynamic stock) {
    final current = _toDouble(stock['currentPrice']);
    final previous = _toDouble(stock['previousClose'], fallback: current);
    if (previous == 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  @override
  Widget build(BuildContext context) {
    final filteredResults = _filteredAndSortedResults;
    final hasLiveData = _hasAnyLiveData(filteredResults);

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
            Text('Search Results', style: PremiumTypography.h3),
            Text(
              '${filteredResults.length} stocks found',
              style: PremiumTypography.caption,
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.ios_share_rounded),
            tooltip: 'Export Results',
            onPressed: filteredResults.isEmpty
                ? null
                : () => _copyResultsReport(filteredResults),
          ),
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
          if (hasLiveData)
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: PremiumUI.spacingL,
              ),
              child: _buildDataQualityCard(filteredResults),
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
    final symbol = stock['symbol']?.toString().trim().isNotEmpty == true
        ? stock['symbol'].toString()
        : 'NA';
    final companyName = _companyName(stock);
    final currentPrice = _toDouble(stock['currentPrice']);
    final previousClose = _toDouble(
      stock['previousClose'],
      fallback: currentPrice,
    );
    final change = currentPrice - previousClose;
    final changePercent = _calculateChangePercent(stock);
    final sector = _displaySector(stock['sector']);
    final tag = _sourceTag(stock);

    return StockListTile(
      symbol: symbol,
      companyName: companyName,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      sectorTag: sector,
      dataTag: tag['label'] as String?,
      dataTagBackgroundColor: tag['bg'] as Color?,
      dataTagTextColor: tag['fg'] as Color?,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                StockDetailScreen(symbol: symbol, stockData: stock),
          ),
        );
      },
    );
  }

  String _companyName(dynamic stock) {
    final name =
        stock['companyName']?.toString().trim() ??
        stock['company_name']?.toString().trim() ??
        stock['name']?.toString().trim() ??
        '';
    return name.isEmpty ? 'Not Available' : name;
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
          color: isSelected ? PremiumColors.neonTeal : PremiumColors.surfaceBg,
          borderRadius: BorderRadius.circular(PremiumUI.radiusL),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: PremiumTypography.body2.copyWith(
                color: isSelected
                    ? PremiumColors.textOnAccent
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
                color: PremiumColors.textOnAccent,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDataQualityCard(List<dynamic> stocks) {
    int live = 0;

    for (final stock in stocks) {
      final source = _sourceKey(stock);
      if (source == 'FINNHUB_API') {
        live++;
      }
    }

    return PremiumCard(
      padding: const EdgeInsets.symmetric(
        horizontal: PremiumUI.spacingM,
        vertical: PremiumUI.spacingS,
      ),
      child: Row(
        children: [
          const Icon(
            Icons.verified_outlined,
            color: PremiumColors.neonTeal,
            size: 18,
          ),
          const SizedBox(width: PremiumUI.spacingS),
          Expanded(
            child: Wrap(
              spacing: PremiumUI.spacingS,
              runSpacing: PremiumUI.spacingS,
              children: [_buildStatusPill('Live $live', PremiumColors.profit)],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusPill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(PremiumUI.radiusM),
      ),
      child: Text(
        label,
        style: PremiumTypography.caption.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
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
                  Text('Filter by Sector', style: PremiumTypography.h3),
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
                            borderRadius: BorderRadius.circular(
                              PremiumUI.radiusL,
                            ),
                          ),
                          child: Text(
                            sector,
                            style: PremiumTypography.body2.copyWith(
                              color: isSelected
                                  ? PremiumColors.textOnAccent
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

  double _toDouble(dynamic value, {double fallback = 0.0}) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    if (value is String) {
      final normalized = value.replaceAll(',', '').trim();
      if (normalized.isEmpty) return fallback;
      return double.tryParse(normalized) ?? fallback;
    }
    return fallback;
  }

  String? _displaySector(dynamic value) {
    final raw = value?.toString().trim() ?? '';
    if (_isMissingLabel(raw)) return null;
    return raw;
  }

  bool _isMissingLabel(String value) {
    final normalized = value.trim().toLowerCase();
    return normalized.isEmpty ||
        normalized == 'unknown' ||
        normalized == 'n/a' ||
        normalized == 'na' ||
        normalized == 'none' ||
        normalized == 'null' ||
        normalized == 'unspecified' ||
        normalized == 'not available';
  }

  String _sourceKey(dynamic stock) {
    return (stock['data_source'] ?? stock['dataSource'] ?? '')
        .toString()
        .trim()
        .toUpperCase();
  }

  Map<String, dynamic> _sourceTag(dynamic stock) {
    final source = _sourceKey(stock);

    if (source == 'FINNHUB_API') {
      return {
        'label': 'Live',
        'bg': PremiumColors.profit.withValues(alpha: 0.14),
        'fg': PremiumColors.profit,
      };
    }

    return {'label': null, 'bg': null, 'fg': null};
  }

  bool _hasAnyLiveData(List<dynamic> stocks) {
    return stocks.any((stock) => _sourceKey(stock) == 'FINNHUB_API');
  }

  Future<void> _copyResultsReport(List<dynamic> stocks) async {
    final buffer = StringBuffer();
    buffer.writeln('EquiScan Screener Report');
    buffer.writeln('Query: ${widget.query}');
    buffer.writeln('Generated: ${DateTime.now().toIso8601String()}');
    buffer.writeln('Results: ${stocks.length}');
    buffer.writeln('');
    buffer.writeln('Top Matches');

    for (int i = 0; i < stocks.length && i < 20; i++) {
      final stock = stocks[i];
      final symbol = stock['symbol']?.toString().trim().isNotEmpty == true
          ? stock['symbol'].toString()
          : 'NA';
      final name = _companyName(stock);
      final price = _toDouble(stock['currentPrice']).toStringAsFixed(2);
      final changePct = _calculateChangePercent(stock).toStringAsFixed(2);
      buffer.writeln('${i + 1}. $symbol | $name | INR $price | $changePct%');
    }

    await Clipboard.setData(ClipboardData(text: buffer.toString()));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Result report copied to clipboard')),
    );
  }
}
