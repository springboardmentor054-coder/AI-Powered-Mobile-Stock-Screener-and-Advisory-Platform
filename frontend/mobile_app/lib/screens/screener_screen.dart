import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class ScreenerScreen extends StatefulWidget {
  const ScreenerScreen({super.key});

  @override
  State<ScreenerScreen> createState() => _ScreenerScreenState();
}

class _ScreenerScreenState extends State<ScreenerScreen> {
  final _queryController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  List<dynamic>? _results;
  String? _error;
  String? _dsl;
  String? _sql;

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _runScreener() async {
    final query = _queryController.text.trim();
    
    if (query.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a query')),
      );
      return;
    }

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
        '/screener/run',
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Stock Screener'),
        elevation: 2,
      ),
      body: Column(
        children: [
          // Query Input Section
          Container(
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

          // Results Section
          Expanded(
            child: _buildResults(),
          ),
        ],
      ),
    );
  }

  Widget _buildResults() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
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
      );
    }

    if (_results == null) {
      return Center(
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
      );
    }

    if (_results!.isEmpty) {
      return Center(
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
      );
    }

    return Column(
      children: [
        // Results Header
        Container(
          padding: const EdgeInsets.all(16.0),
          color: Colors.blue[50],
          child: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green[600]),
              const SizedBox(width: 8),
              Text(
                'Found ${_results!.length} stocks',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),

        // Stock List
        Expanded(
          child: ListView.builder(
            itemCount: _results!.length,
            itemBuilder: (context, index) {
              final stock = _results![index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.blue[100],
                    child: Text(
                      stock['symbol']?.toString().substring(0, 1).toUpperCase() ?? 'S',
                      style: TextStyle(
                        color: Colors.blue[900],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    stock['symbol']?.toString() ?? 'N/A',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    stock['company_name']?.toString() ?? 'N/A',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (stock['market_cap'] != null)
                        Text(
                          '₹${_formatNumber(stock['market_cap'])}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      if (stock['pe_ratio'] != null)
                        Text(
                          'P/E: ${stock['pe_ratio']}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                    ],
                  ),
                  onTap: () {
                    _showStockDetails(stock);
                  },
                ),
              );
            },
          ),
        ),
      ],
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

  void _showStockDetails(Map<String, dynamic> stock) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(24),
          child: ListView(
            controller: scrollController,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          stock['symbol']?.toString() ?? 'N/A',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          stock['company_name']?.toString() ?? 'N/A',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 32),

              // Details
              _buildDetailRow('Sector', stock['sector']),
              _buildDetailRow('Industry', stock['industry']),
              _buildDetailRow('Market Cap', _formatNumber(stock['market_cap'])),
              _buildDetailRow('P/E Ratio', stock['pe_ratio']),
              _buildDetailRow('P/B Ratio', _formatPBRatio(stock)),
              _buildDetailRow('Debt to Equity', _formatDebtToEquity(stock)),
              _buildDetailRow('ROE', _formatROE(stock)),
              _buildDetailRow('Dividend Yield', stock['dividend_yield'] != null ? '${stock['dividend_yield']}%' : 'No dividend'),
              _buildDetailRow('Promoter Holding', stock['promoter_holding'] != null ? '${stock['promoter_holding']}%' : 'Data not available'),
              _buildDetailRow('Book Value/Share', _formatBookValue(stock)),
              _buildDetailRow('Profit Margin', stock['profit_margin'] != null ? '${stock['profit_margin']}%' : 'Data not available'),
              _buildDetailRow('Operating Margin', stock['operating_margin'] != null ? '${stock['operating_margin']}%' : 'Data not available'),
            ],
          ),
        ),
      ),
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
