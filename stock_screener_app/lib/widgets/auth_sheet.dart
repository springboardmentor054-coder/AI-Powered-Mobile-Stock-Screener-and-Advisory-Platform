import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/premium_theme.dart';

Future<bool> showAuthSheet(BuildContext context) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const _AuthSheet(),
  );
  return result == true;
}

class _AuthSheet extends StatefulWidget {
  const _AuthSheet();

  @override
  State<_AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends State<_AuthSheet> {
  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();
  final _registerNameController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _registerPasswordController = TextEditingController();

  bool _isLoginMode = true;
  bool _isSubmitting = false;
  String _selectedAvatar = AuthService.avatarOptions.first;

  @override
  void dispose() {
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _registerNameController.dispose();
    _registerEmailController.dispose();
    _registerPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);

    return AnimatedPadding(
      duration: PremiumUI.animationNormal,
      curve: Curves.easeOut,
      padding: EdgeInsets.only(bottom: mediaQuery.viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: PremiumColors.cardBg,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: PremiumColors.textMuted.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text('EquiScan Account', style: PremiumTypography.h2),
                const SizedBox(height: 6),
                Text(
                  'Login to save watchlist and portfolio. Screener stays open for guests.',
                  style: PremiumTypography.body2,
                ),
                const SizedBox(height: 16),
                _buildModeToggle(),
                const SizedBox(height: 16),
                _isLoginMode ? _buildLoginForm() : _buildRegisterForm(),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: PremiumColors.surfaceBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Demo account: demo@equiscan.app / Demo@123',
                    style: PremiumTypography.caption,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModeToggle() {
    return Container(
      decoration: BoxDecoration(
        color: PremiumColors.surfaceBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildModeButton('Login', _isLoginMode, () {
              setState(() => _isLoginMode = true);
            }),
          ),
          Expanded(
            child: _buildModeButton('Register', !_isLoginMode, () {
              setState(() => _isLoginMode = false);
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildModeButton(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? PremiumColors.neonTeal : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: PremiumTypography.body2.copyWith(
            color: selected
                ? PremiumColors.textOnAccent
                : PremiumColors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      children: [
        TextField(
          controller: _loginEmailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email',
            hintText: 'you@example.com',
            prefixIcon: Icon(Icons.alternate_email_rounded),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _loginPasswordController,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: 'Password',
            prefixIcon: Icon(Icons.lock_outline_rounded),
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isSubmitting ? null : _submitLogin,
            icon: _isSubmitting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.login_rounded),
            label: Text(_isSubmitting ? 'Please wait...' : 'Login'),
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterForm() {
    return Column(
      children: [
        TextField(
          controller: _registerNameController,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Full Name',
            hintText: 'Your name',
            prefixIcon: Icon(Icons.person_outline_rounded),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerEmailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email',
            hintText: 'you@example.com',
            prefixIcon: Icon(Icons.alternate_email_rounded),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerPasswordController,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: 'Password',
            hintText: 'Minimum 6 characters',
            prefixIcon: Icon(Icons.lock_outline_rounded),
          ),
        ),
        const SizedBox(height: 12),
        _buildAvatarPicker(),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isSubmitting ? null : _submitRegister,
            icon: _isSubmitting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.person_add_alt_1_rounded),
            label: Text(_isSubmitting ? 'Please wait...' : 'Create Account'),
          ),
        ),
      ],
    );
  }

  Widget _buildAvatarPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Select Avatar', style: PremiumTypography.body2),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: AuthService.avatarOptions.map((avatar) {
            final selected = _selectedAvatar == avatar;
            return GestureDetector(
              onTap: () => setState(() => _selectedAvatar = avatar),
              child: AnimatedContainer(
                duration: PremiumUI.animationFast,
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: selected
                      ? PremiumColors.neonTeal
                      : PremiumColors.surfaceBg,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: selected
                        ? PremiumColors.neonTeal
                        : PremiumColors.textMuted.withValues(alpha: 0.2),
                  ),
                ),
                child: Text(
                  avatar,
                  style: PremiumTypography.body2.copyWith(
                    fontWeight: FontWeight.w700,
                    color: selected
                        ? PremiumColors.textOnAccent
                        : PremiumColors.textPrimary,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Future<void> _submitLogin() async {
    setState(() => _isSubmitting = true);
    final result = await AuthService.instance.login(
      email: _loginEmailController.text,
      password: _loginPasswordController.text,
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result.success) {
      Navigator.pop(context, true);
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.message),
        backgroundColor: PremiumColors.loss,
      ),
    );
  }

  Future<void> _submitRegister() async {
    setState(() => _isSubmitting = true);
    final result = await AuthService.instance.register(
      name: _registerNameController.text,
      email: _registerEmailController.text,
      password: _registerPasswordController.text,
      avatarLabel: _selectedAvatar,
    );
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result.success) {
      Navigator.pop(context, true);
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.message),
        backgroundColor: PremiumColors.loss,
      ),
    );
  }
}
