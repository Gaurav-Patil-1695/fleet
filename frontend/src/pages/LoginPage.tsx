import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { login } from '../services/authService';
import { parseError } from '../utils/errorUtils';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim() || !password.trim()) {
      return 'Email and password are required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Enter a valid email address.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      setPassword('');
      return;
    }

    setLoading(true);
    try {
      const tokenResponse = await login({ email: email.trim(), password });
      setAuthData(tokenResponse, rememberMe);

      // Decode role from JWT payload
      const payload = JSON.parse(atob(tokenResponse.access_token.split('.')[1]));
      const role: string = payload.role ?? '';

      if (role === 'technician') {
        navigate('/my-work-orders', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const parsed = parseError(err);
      if (parsed.code === '401' || parsed.message?.toLowerCase().includes('invalid')) {
        setErrorMessage('Invalid email or password — please try again');
      } else {
        setErrorMessage(parsed.message ?? 'Invalid email or password — please try again');
      }
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Brand Header */}
        <div className={styles.brand}>
          <div className={styles.logoBox}>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.logoIcon}
            >
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h4l3 5v3h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div className={styles.appName}>FleetOps</div>
          <div className={styles.appTagline}>Fleet Management Platform</div>
        </div>

        {/* Login Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Sign in to your account</h1>
            <p className={styles.cardSubtitle}>Enter your credentials to access your depot.</p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.errorIcon}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                className={styles.input}
                placeholder="you@depot.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={320}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className={styles.field}>
              <div className={styles.passwordHeader}>
                <label htmlFor="login-password" className={styles.label}>
                  Password
                </label>
                {/* Forgot password is out of scope; shown as UI only */}
                <span className={styles.forgotLink}>Forgot password?</span>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Remember me */}
            <div className={styles.rememberRow}>
              <input
                type="checkbox"
                id="login-remember"
                className={styles.checkbox}
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="login-remember" className={styles.rememberLabel}>
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerHelp}>
            Having trouble signing in? Contact your depot administrator.
          </p>
          <p className={styles.footerCopy}>
            FleetOps &copy; 2025 — All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
