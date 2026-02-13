import 'dart:async';

import 'package:flutter/material.dart';

import '../services/api_config.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/premium_theme.dart';
import '../widgets/auth_sheet.dart';
import '../widgets/premium_card.dart';
import 'result_screen_premium.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _queryController = TextEditingController();
  final FocusNode _queryFocusNode = FocusNode();

  bool _isLoading = false;
  bool _isServerHealthy = false;
  String? _errorMessage;
  DateTime? _lastServerCheck;
  Timer? _healthTimer;

  final List<_TemplatePreset> _templates = const [
    _TemplatePreset(
      title: 'Quality Compounders',
      subtitle: 'Strong profitability with controlled leverage',
      query: 'Show stocks with ROE above 15 and debt to equity below 0.5',
      icon: Icons.shield_rounded,
      tone: Color(0xFFDBEAFE),
    ),
    _TemplatePreset(
      title: 'Reasonable Valuation',
      subtitle: 'Earnings-backed valuations in large businesses',
      query: 'Show stocks with PE below 20 and market cap above 1000',
      icon: Icons.balance_rounded,
      tone: Color(0xFFE0F2FE),
    ),
    _TemplatePreset(
      title: 'Growth Watch',
      subtitle: 'Revenue momentum with healthy balance sheets',
      query:
          'Show stocks with revenue growth above 20 and debt to equity below 1',
      icon: Icons.trending_up_rounded,
      tone: Color(0xFFDCFCE7),
    ),
    _TemplatePreset(
      title: 'Defensive Filter',
      subtitle: 'Conservative profile with tighter risk controls',
      query:
          'Show stocks with PE below 25 and debt to equity below 0.3 and market cap above 5000',
      icon: Icons.security_rounded,
      tone: Color(0xFFFFEDD5),
    ),
  ];

  final List<String> _quickPrompts = const [
    'IT stocks with PE below 25',
    'Banking stocks with ROE above 15',
    'Low debt pharma stocks',
    'Large cap growth stocks',
    'Dividend stocks with low volatility',
  ];

  @override
  void initState() {
    super.initState();
    _queryController.addListener(_onQueryChanged);
    _checkServerHealth();
    _healthTimer = Timer.periodic(
      const Duration(seconds: 25),
      (_) => _checkServerHealth(silent: true),
    );
  }

  void _onQueryChanged() {
    if (!mounted) return;
    setState(() {});
  }

  @override
  void dispose() {
    _healthTimer?.cancel();
    _queryController.removeListener(_onQueryChanged);
    _queryController.dispose();
    _queryFocusNode.dispose();
    super.dispose();
  }

  Future<void> _checkServerHealth({bool silent = false}) async {
    bool isHealthy = false;

    try {
      isHealthy = await ApiService().checkHealth();
    } catch (_) {
      isHealthy = false;
    }

    if (!mounted) return;

    setState(() {
      _isServerHealthy = isHealthy;
      _lastServerCheck = DateTime.now();
      if (!isHealthy && !silent) {
        _errorMessage = 'Backend is offline. ${ApiConfig.physicalDeviceHint}';
      } else if (_errorMessage?.contains('Backend is offline') == true) {
        _errorMessage = null;
      }
    });
  }

  Future<void> _runScreener({String? predefinedQuery}) async {
    final query = predefinedQuery ?? _queryController.text.trim();

    if (query.isEmpty) {
      setState(() => _errorMessage = 'Enter a screening query to continue.');
      return;
    }

    if (!_isServerHealthy) {
      setState(
        () =>
            _errorMessage = 'Backend is offline. Refresh health and try again.',
      );
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
          _errorMessage = 'No matches found for this query.';
          _isLoading = false;
        });
        return;
      }

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ResultScreen(results: results, query: query),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _fillQuery(String query, {bool focusField = false}) {
    _queryController.value = TextEditingValue(
      text: query,
      selection: TextSelection.collapsed(offset: query.length),
    );

    setState(() => _errorMessage = null);

    if (focusField) {
      _queryFocusNode.requestFocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasQuery = _queryController.text.trim().isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFFF6FAFF),
      body: Stack(
        children: [
          Positioned(
            left: -80,
            top: -95,
            child: Container(
              width: 220,
              height: 220,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [Color(0x4060A5FA), Color(0x0060A5FA)],
                ),
              ),
            ),
          ),
          Positioned(
            right: -90,
            bottom: -120,
            child: Container(
              width: 240,
              height: 240,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [Color(0x3393C5FD), Color(0x0093C5FD)],
                ),
              ),
            ),
          ),
          SafeArea(
            child: RefreshIndicator(
              onRefresh: () => _checkServerHealth(),
              color: PremiumColors.neonTeal,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                children: [
                  _buildHeroCard(),
                  const SizedBox(height: 14),
                  _buildWorkspaceCard(hasQuery: hasQuery),
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 10),
                    _buildErrorBanner(),
                  ],
                  const SizedBox(height: 16),
                  _buildQuickPromptsCard(),
                  const SizedBox(height: 16),
                  _buildTemplateSection(),
                  const SizedBox(height: 10),
                  Text(
                    'Pull down to refresh backend health and market data links.',
                    style: PremiumTypography.caption.copyWith(
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroCard() {
    final statusBg = _isServerHealthy
        ? const Color(0xFFDCFCE7)
        : const Color(0xFFFEE2E2);
    final statusText = _isServerHealthy
        ? const Color(0xFF166534)
        : const Color(0xFFB91C1C);

    return AnimatedBuilder(
      animation: AuthService.instance,
      builder: (context, _) {
        final auth = AuthService.instance;

        return Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1E3A8A), Color(0xFF2563EB), Color(0xFF38BDF8)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1E3A8A).withValues(alpha: 0.22),
                blurRadius: 22,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: Text(
                      auth.currentUser?.avatarLabel ?? 'EQ',
                      style: PremiumTypography.body1.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'EquiScan',
                          style: PremiumTypography.h2.copyWith(
                            color: Colors.white,
                            fontSize: 30,
                          ),
                        ),
                        Text(
                          'AI Screening Command Center',
                          style: PremiumTypography.caption.copyWith(
                            color: Colors.white.withValues(alpha: 0.92),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () async {
                      if (auth.isAuthenticated) {
                        await AuthService.instance.logout();
                        if (!mounted) return;
                        ScaffoldMessenger.of(this.context).showSnackBar(
                          const SnackBar(
                            content: Text('Logged out successfully.'),
                          ),
                        );
                        return;
                      }

                      final loggedIn = await showAuthSheet(context);
                      if (!mounted || !loggedIn) return;
                      ScaffoldMessenger.of(this.context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Welcome, ${AuthService.instance.currentUser?.name ?? 'Investor'}',
                          ),
                          backgroundColor: PremiumColors.profit,
                        ),
                      );
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white,
                      backgroundColor: Colors.white.withValues(alpha: 0.14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: Icon(
                      auth.isAuthenticated
                          ? Icons.logout_rounded
                          : Icons.login_rounded,
                      size: 16,
                    ),
                    label: Text(auth.isAuthenticated ? 'Logout' : 'Login'),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _buildStatusPill(
                      icon: _isServerHealthy
                          ? Icons.cloud_done_rounded
                          : Icons.cloud_off_rounded,
                      text: _isServerHealthy
                          ? 'Server Online'
                          : 'Server Offline',
                      background: statusBg,
                      textColor: statusText,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(999),
                      onTap: () => _checkServerHealth(),
                      child: _buildStatusPill(
                        icon: Icons.refresh_rounded,
                        text: _lastServerCheck == null
                            ? 'Checking...'
                            : 'Updated ${_formatTime(_lastServerCheck!)}',
                        background: Colors.white.withValues(alpha: 0.2),
                        textColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusPill({
    required IconData icon,
    required String text,
    required Color background,
    required Color textColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        children: [
          Icon(icon, size: 15, color: textColor),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: PremiumTypography.caption.copyWith(
                color: textColor,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWorkspaceCard({required bool hasQuery}) {
    final canSubmit = !_isLoading && _isServerHealthy && hasQuery;

    return PremiumCard(
      backgroundColor: Colors.white,
      borderRadius: BorderRadius.circular(18),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Screener Workspace',
            style: PremiumTypography.h3.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            'Type your strategy and run instantly.',
            style: PremiumTypography.caption.copyWith(
              color: const Color(0xFF64748B),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _queryController,
            focusNode: _queryFocusNode,
            minLines: 2,
            maxLines: 3,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _runScreener(),
            decoration: InputDecoration(
              hintText: 'Show finance stocks with PE below 20 and ROE above 15',
              alignLabelWithHint: true,
              prefixIcon: const Icon(Icons.manage_search_rounded),
              suffixIcon: hasQuery
                  ? IconButton(
                      onPressed: () => _fillQuery(''),
                      icon: const Icon(Icons.clear_rounded),
                    )
                  : null,
              fillColor: const Color(0xFFF7FAFF),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFFBFDBFE)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(
                  color: Color(0xFF1D4ED8),
                  width: 1.8,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: hasQuery ? () => _fillQuery('') : null,
                  child: const Text('Clear'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: canSubmit ? () => _runScreener() : null,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Icon(Icons.play_arrow_rounded),
                  label: Text(_isLoading ? 'Running...' : 'Run Screener'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1D4ED8),
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(46),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickPromptsCard() {
    return PremiumCard(
      backgroundColor: Colors.white,
      borderRadius: BorderRadius.circular(18),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick Prompts',
            style: PremiumTypography.h3.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _quickPrompts.map(_buildPromptChip).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPromptChip(String prompt) {
    return ActionChip(
      onPressed: _isLoading
          ? null
          : () => _fillQuery('Show $prompt', focusField: true),
      backgroundColor: const Color(0xFFEFF6FF),
      side: BorderSide(color: const Color(0xFF93C5FD).withValues(alpha: 0.6)),
      label: Text(
        prompt,
        style: PremiumTypography.caption.copyWith(
          color: const Color(0xFF1D4ED8),
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildTemplateSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Curated Templates',
          style: PremiumTypography.h3.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        ..._templates.map(_buildTemplateTile),
      ],
    );
  }

  Widget _buildTemplateTile(_TemplatePreset template) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: PremiumCard(
        onTap: _isLoading
            ? null
            : () => _fillQuery(template.query, focusField: true),
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.circular(16),
        padding: const EdgeInsets.all(13),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: template.tone,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(template.icon, color: const Color(0xFF1D4ED8)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    template.title,
                    style: PremiumTypography.body1.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    template.subtitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: PremiumTypography.caption.copyWith(
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: _isLoading || !_isServerHealthy
                  ? null
                  : () => _runScreener(predefinedQuery: template.query),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(64, 32),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 0,
                ),
                textStyle: PremiumTypography.caption.copyWith(
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              child: const Text('Run'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.error_outline_rounded,
            color: PremiumColors.loss,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _errorMessage ?? '',
              style: PremiumTypography.caption.copyWith(
                color: const Color(0xFFB91C1C),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          TextButton(
            onPressed: () => _checkServerHealth(),
            style: TextButton.styleFrom(
              minimumSize: const Size(0, 28),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              padding: const EdgeInsets.symmetric(horizontal: 8),
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime value) {
    final diff = DateTime.now().difference(value);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }
}

class _TemplatePreset {
  final String title;
  final String subtitle;
  final String query;
  final IconData icon;
  final Color tone;

  const _TemplatePreset({
    required this.title,
    required this.subtitle,
    required this.query,
    required this.icon,
    required this.tone,
  });
}
