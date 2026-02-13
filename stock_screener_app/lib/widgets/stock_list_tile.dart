import 'package:flutter/material.dart';
import '../theme/premium_theme.dart';
import 'premium_card.dart';

/// Premium Stock List Tile - Modern, Clean, Trust-building
class StockListTile extends StatelessWidget {
  final String symbol;
  final String companyName;
  final double price;
  final double change;
  final double changePercent;
  final String? sectorTag;
  final String? dataTag;
  final Color? dataTagBackgroundColor;
  final Color? dataTagTextColor;
  final VoidCallback? onTap;
  final bool showSectorTag;

  const StockListTile({
    super.key,
    required this.symbol,
    required this.companyName,
    required this.price,
    required this.change,
    required this.changePercent,
    this.sectorTag,
    this.dataTag,
    this.dataTagBackgroundColor,
    this.dataTagTextColor,
    this.onTap,
    this.showSectorTag = true,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = change >= 0;
    final changeColor = isPositive ? PremiumColors.profit : PremiumColors.loss;

    return PremiumCard(
      onTap: onTap,
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      child: Row(
        children: [
          // Company Logo Placeholder (Circle with first letter)
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: PremiumColors.primaryGradient,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                symbol.isNotEmpty ? symbol[0] : '?',
                style: PremiumTypography.h3.copyWith(
                  color: PremiumColors.textOnAccent,
                ),
              ),
            ),
          ),
          const SizedBox(width: PremiumUI.spacingM),

          // Stock Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      symbol,
                      style: PremiumTypography.body1.copyWith(
                        fontWeight: FontWeight.w600,
                        fontFamily: PremiumTypography.numericFont,
                      ),
                    ),
                    if (showSectorTag && sectorTag != null) ...[
                      const SizedBox(width: PremiumUI.spacingS),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: PremiumColors.surfaceBg,
                          borderRadius: BorderRadius.circular(
                            PremiumUI.radiusS,
                          ),
                        ),
                        child: Text(
                          sectorTag!,
                          style: PremiumTypography.caption.copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                    if (dataTag != null) ...[
                      const SizedBox(width: PremiumUI.spacingS),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color:
                              dataTagBackgroundColor ??
                              PremiumColors.info.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(
                            PremiumUI.radiusS,
                          ),
                        ),
                        child: Text(
                          dataTag!,
                          style: PremiumTypography.caption.copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: dataTagTextColor ?? PremiumColors.info,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  companyName,
                  style: PremiumTypography.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Price & Change
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'INR ${price.toStringAsFixed(2)}',
                style: PremiumTypography.priceMedium.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isPositive ? Icons.arrow_drop_up : Icons.arrow_drop_down,
                    color: changeColor,
                    size: 20,
                  ),
                  Text(
                    '${changePercent.toStringAsFixed(2)}%',
                    style: PremiumTypography.body2.copyWith(
                      color: changeColor,
                      fontWeight: FontWeight.w600,
                      fontFamily: PremiumTypography.numericFont,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Compact Stock List Tile (for smaller lists)
class CompactStockTile extends StatelessWidget {
  final String symbol;
  final String companyName;
  final double price;
  final double changePercent;
  final VoidCallback? onTap;

  const CompactStockTile({
    super.key,
    required this.symbol,
    required this.companyName,
    required this.price,
    required this.changePercent,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = changePercent >= 0;
    final changeColor = isPositive ? PremiumColors.profit : PremiumColors.loss;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(PremiumUI.radiusM),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: PremiumUI.spacingM,
          vertical: PremiumUI.spacingS,
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: PremiumColors.primaryGradient,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  symbol.isNotEmpty ? symbol[0] : '?',
                  style: PremiumTypography.body2.copyWith(
                    color: PremiumColors.textOnAccent,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            const SizedBox(width: PremiumUI.spacingM),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    symbol,
                    style: PremiumTypography.body2.copyWith(
                      fontWeight: FontWeight.w700,
                      fontFamily: PremiumTypography.numericFont,
                    ),
                  ),
                  Text(
                    companyName,
                    style: PremiumTypography.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Text(
              'INR ${price.toStringAsFixed(2)}',
              style: PremiumTypography.body2.copyWith(
                fontFamily: PremiumTypography.numericFont,
              ),
            ),
            const SizedBox(width: PremiumUI.spacingM),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: changeColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(PremiumUI.radiusS),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                    size: 12,
                    color: changeColor,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${changePercent.toStringAsFixed(2)}%',
                    style: PremiumTypography.caption.copyWith(
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
      ),
    );
  }
}

/// Skeleton Loader for Stock Tile
class StockTileSkeleton extends StatelessWidget {
  const StockTileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return PremiumCard(
      padding: const EdgeInsets.all(PremiumUI.spacingM),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: PremiumColors.surfaceBg,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: PremiumUI.spacingM),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 80,
                  height: 16,
                  decoration: BoxDecoration(
                    color: PremiumColors.surfaceBg,
                    borderRadius: BorderRadius.circular(PremiumUI.radiusS),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 120,
                  height: 12,
                  decoration: BoxDecoration(
                    color: PremiumColors.surfaceBg,
                    borderRadius: BorderRadius.circular(PremiumUI.radiusS),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                width: 60,
                height: 18,
                decoration: BoxDecoration(
                  color: PremiumColors.surfaceBg,
                  borderRadius: BorderRadius.circular(PremiumUI.radiusS),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: 50,
                height: 14,
                decoration: BoxDecoration(
                  color: PremiumColors.surfaceBg,
                  borderRadius: BorderRadius.circular(PremiumUI.radiusS),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
