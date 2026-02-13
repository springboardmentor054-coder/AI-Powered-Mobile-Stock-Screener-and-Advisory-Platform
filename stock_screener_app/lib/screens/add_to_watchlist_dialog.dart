import 'package:flutter/material.dart';
import '../services/watchlist_api_service.dart';
import '../services/alert_service.dart';

class AddToWatchlistDialog extends StatefulWidget {
  final String symbol;
  final String companyName;
  final double currentPrice;
  final int userId;

  const AddToWatchlistDialog({
    super.key,
    required this.symbol,
    required this.companyName,
    required this.currentPrice,
    required this.userId,
  });

  @override
  State<AddToWatchlistDialog> createState() => _AddToWatchlistDialogState();
}

class _AddToWatchlistDialogState extends State<AddToWatchlistDialog> {
  bool _isLoading = false;
  bool _createAlert = false;
  double _alertPriceHigh = 0;
  double _alertPriceLow = 0;
  String _alertType = 'price_movement';

  late TextEditingController _priceHighController;
  late TextEditingController _priceLowController;

  final WatchlistApiService _watchlistService = WatchlistApiService();
  final AlertService _alertService = AlertService();

  @override
  void initState() {
    super.initState();
    _alertPriceHigh = widget.currentPrice * 1.1;
    _alertPriceLow = widget.currentPrice * 0.9;

    _priceHighController = TextEditingController(
      text: _alertPriceHigh.toStringAsFixed(2),
    );
    _priceLowController = TextEditingController(
      text: _alertPriceLow.toStringAsFixed(2),
    );
  }

  @override
  void dispose() {
    _priceHighController.dispose();
    _priceLowController.dispose();
    super.dispose();
  }

  Future<void> _addToWatchlist() async {
    setState(() => _isLoading = true);

    try {
      print('Adding ${widget.symbol} to watchlist...');

      final success = await _watchlistService.addToWatchlist(
        widget.userId,
        widget.symbol,
      );

      if (mounted) {
        if (success) {
          // Successfully added
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${widget.symbol} added to watchlist'),
              backgroundColor: const Color(0xFF10B981),
              duration: const Duration(seconds: 2),
            ),
          );

          if (_createAlert) {
            print('Creating alert for ${widget.symbol}...');
            await _createAlertForStock();
          }

          await Future.delayed(const Duration(milliseconds: 500));
          if (mounted) {
            Navigator.pop(context, true);
          }
        } else {
          // Already in watchlist (409)
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${widget.symbol} is already in your watchlist'),
              backgroundColor: const Color(0xFFF59E0B),
              duration: const Duration(seconds: 2),
            ),
          );
          
          // Still close the dialog after a short delay
          await Future.delayed(const Duration(milliseconds: 1500));
          if (mounted) {
            Navigator.pop(context, false);
          }
        }
      }
    } catch (e) {
      print('Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: const Color(0xFFEF4444),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _createAlertForStock() async {
    try {
      switch (_alertType) {
        case 'above':
          await _alertService.createAlert(
            userId: widget.userId,
            symbol: widget.symbol,
            alertType: 'price_above',
            targetPrice: _alertPriceHigh,
          );
          print('Alert: Price above ₹${_alertPriceHigh.toStringAsFixed(2)}');
          break;
        case 'below':
          await _alertService.createAlert(
            userId: widget.userId,
            symbol: widget.symbol,
            alertType: 'price_below',
            targetPrice: _alertPriceLow,
          );
          print('Alert: Price below ₹${_alertPriceLow.toStringAsFixed(2)}');
          break;
        case 'price_movement':
        default:
          await _alertService.createAlert(
            userId: widget.userId,
            symbol: widget.symbol,
            alertType: 'price_above',
            targetPrice: _alertPriceHigh,
          );
          await _alertService.createAlert(
            userId: widget.userId,
            symbol: widget.symbol,
            alertType: 'price_below',
            targetPrice: _alertPriceLow,
          );
          print('Alert: Price movement ±10%');
          break;
      }
    } catch (e) {
      print('Alert warning: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Add to Watchlist',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.companyName,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close, size: 20),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Symbol', style: Theme.of(context).textTheme.bodySmall),
                    Text(widget.symbol,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        )),
                    const SizedBox(width: 16),
                    Text('Price', style: Theme.of(context).textTheme.bodySmall),
                    Text('₹${widget.currentPrice.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF10B981),
                        )),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Checkbox(
                    value: _createAlert,
                    onChanged: _isLoading
                        ? null
                        : (value) {
                      setState(() => _createAlert = value ?? false);
                    },
                    activeColor: const Color(0xFF3B82F6),
                  ),
                  Expanded(
                    child: Text(
                      'Create price alert',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
              if (_createAlert) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      _buildRadio('price_movement', 'Price Movement', '±10%'),
                      const Divider(),
                      _buildRadio('above', 'Price Goes Above',
                          '₹${_alertPriceHigh.toStringAsFixed(2)}'),
                      const Divider(),
                      _buildRadio('below', 'Price Goes Below',
                          '₹${_alertPriceLow.toStringAsFixed(2)}'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (_alertType == 'above')
                  _buildPriceField('High', _priceHighController),
                if (_alertType == 'below')
                  _buildPriceField('Low', _priceLowController),
              ],
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _addToWatchlist,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                          AlwaysStoppedAnimation(Colors.white),
                        ),
                      )
                          : const Text(
                        'Add to Watchlist',
                        style: TextStyle(color: Colors.white),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRadio(String value, String title, String subtitle) {
    return RadioListTile<String>(
      value: value,
      groupValue: _alertType,
      onChanged: _isLoading ? null : (val) {
        setState(() => _alertType = val ?? _alertType);
      },
      title: Text(title, style: Theme.of(context).textTheme.bodyMedium),
      subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
      activeColor: const Color(0xFF3B82F6),
    );
  }

  Widget _buildPriceField(String label, TextEditingController controller) {
    return TextField(
      controller: controller,
      enabled: !_isLoading,
      decoration: InputDecoration(
        labelText: 'Alert Price ($label)',
        prefixText: '₹ ',
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      onChanged: (value) {
        setState(() {
          if (label == 'High') {
            _alertPriceHigh = double.tryParse(value) ?? _alertPriceHigh;
          } else {
            _alertPriceLow = double.tryParse(value) ?? _alertPriceLow;
          }
        });
      },
    );
  }
}
