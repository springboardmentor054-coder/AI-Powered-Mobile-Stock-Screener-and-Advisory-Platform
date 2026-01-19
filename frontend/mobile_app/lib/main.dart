import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config/api_config.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'AI Stock Screener',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const ScreenerPage(),
    );
  }
}

class ScreenerPage extends StatefulWidget {
  const ScreenerPage({super.key});

  @override
  State<ScreenerPage> createState() => _ScreenerPageState();
}

class _ScreenerPageState extends State<ScreenerPage> {
  final TextEditingController _controller = TextEditingController();
  List<Map<String, dynamic>> stocks = [];
  bool isLoading = false;
  String? errorMessage;
  String? userQuery;
  bool usedLLM = false;
  Map<String, dynamic>? parsedDSL;
  String? generatedSQL;

  Future<void> runScreener() async {
    if (_controller.text.trim().isEmpty) {
      setState(() {
        errorMessage = "Please enter a query";
      });
      return;
    }

    setState(() {
      isLoading = true;
      errorMessage = null;
      stocks = [];
      userQuery = _controller.text;
    });

    try {
      final response = await http.post(
        Uri.parse(ApiConfig.screenerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"query": _controller.text}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        setState(() {
          stocks = List<Map<String, dynamic>>.from(data['stocks'] ?? []);
          usedLLM = data['usedLLM'] ?? false;
          parsedDSL = data['parsedDSL'];
          generatedSQL = data['generatedSQL'];
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = data['message'] ?? 'Unknown error occurred';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to connect to server: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("AI Stock Screener"),
        elevation: 2,
      ),
      body: Column(
        children: [
          // Query Input Section
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Colors.grey[50],
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: _controller,
                  maxLines: 3,
                  decoration: InputDecoration(
                    border: const OutlineInputBorder(),
                    hintText: "e.g., Technology stocks with PEG ratio below 1.5",
                    labelText: "Enter your stock query",
                    filled: true,
                    fillColor: Colors.white,
                    prefixIcon: const Icon(Icons.search),
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: isLoading ? null : runScreener,
                  icon: isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.play_arrow),
                  label: Text(isLoading ? "Searching..." : "Run Screener"),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
                if (parsedDSL != null || generatedSQL != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      if (parsedDSL != null)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _showJsonDialog(context),
                            icon: const Icon(Icons.code, size: 18),
                            label: const Text('JSON Code'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      if (parsedDSL != null && generatedSQL != null)
                        const SizedBox(width: 8),
                      if (generatedSQL != null)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _showSqlDialog(context),
                            icon: const Icon(Icons.storage, size: 18),
                            label: const Text('SQL Query'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
                if (usedLLM && !isLoading)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.auto_awesome, size: 16, color: Colors.green[700]),
                        const SizedBox(width: 4),
                        Text(
                          'Powered by AI (Groq LLM)',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.green[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          // Results Section
          Expanded(
            child: _buildResultsSection(),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsSection() {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text("Analyzing your query..."),
          ],
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
              const SizedBox(height: 16),
              Text(
                errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      );
    }

    if (stocks.isEmpty && userQuery != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              const Text(
                "No stocks found matching your criteria",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              Text(
                "Try adjusting your query",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      );
    }

    if (stocks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.analytics_outlined, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              "Enter a query to find stocks",
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16.0),
          color: Colors.blue[50],
          child: Text(
            "Found ${stocks.length} stock${stocks.length == 1 ? '' : 's'}",
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Expanded(
          child: ListView.separated(
            itemCount: stocks.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final stock = stocks[index];
              return _buildStockCard(stock);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildStockCard(Map<String, dynamic> stock) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.blue[700],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    stock['symbol'] ?? 'N/A',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    stock['company_name'] ?? 'Unknown Company',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (stock['sector'] != null)
              _buildInfoChip(Icons.category, stock['sector']),
            const SizedBox(height: 8),
            Row(
              children: [
                if (stock['pe_ratio'] != null)
                  Expanded(
                    child: _buildMetric('PE Ratio', _formatNumber(stock['pe_ratio'])),
                  ),
                if (stock['peg_ratio'] != null)
                  Expanded(
                    child: _buildMetric('PEG Ratio', _formatNumber(stock['peg_ratio'])),
                  ),
              ],
            ),
            if (stock['market_cap'] != null) ...[
              const SizedBox(height: 8),
              _buildMetric('Market Cap', _formatMarketCap(stock['market_cap'])),
            ],
            if (stock['promoter_holding_percentage'] != null) ...[
              const SizedBox(height: 8),
              _buildMetric(
                'Promoter Holding',
                '${_toDouble(stock['promoter_holding_percentage'])?.toStringAsFixed(1) ?? 'N/A'}%',
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[700],
          ),
        ),
      ],
    );
  }

  Widget _buildMetric(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value);
    }
    return null;
  }

  String _formatNumber(dynamic value) {
    final num = _toDouble(value);
    if (num == null) return 'N/A';
    return num.toStringAsFixed(2);
  }

  String _formatMarketCap(dynamic marketCap) {
    if (marketCap == null) return 'N/A';
    final value = _toDouble(marketCap);
    if (value == null) return 'N/A';
    
    if (value >= 1e12) {
      return '\$${(value / 1e12).toStringAsFixed(2)}T';
    } else if (value >= 1e9) {
      return '\$${(value / 1e9).toStringAsFixed(2)}B';
    } else if (value >= 1e6) {
      return '\$${(value / 1e6).toStringAsFixed(2)}M';
    }
    return '\$${value.toStringAsFixed(2)}';
  }

  void _showJsonDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.code, color: Colors.blue),
            SizedBox(width: 8),
            Text('Parsed JSON (DSL)'),
          ],
        ),
        content: Container(
          width: double.maxFinite,
          constraints: const BoxConstraints(maxHeight: 400),
          child: SingleChildScrollView(
            child: SelectableText(
              const JsonEncoder.withIndent('  ').convert(parsedDSL),
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 13,
              ),
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

  void _showSqlDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.storage, color: Colors.green),
            SizedBox(width: 8),
            Text('Generated SQL Query'),
          ],
        ),
        content: Container(
          width: double.maxFinite,
          constraints: const BoxConstraints(maxHeight: 400),
          child: SingleChildScrollView(
            child: SelectableText(
              generatedSQL ?? '',
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 13,
              ),
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
