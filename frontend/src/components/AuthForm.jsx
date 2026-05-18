import { useState } from 'react';
import './AuthForm.css';

export default function AuthForm({
  variant,
  title,
  subtitle,
  onLogin,
  onRegister,
  redirectHint,
}) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    email: '',
    password: '',
    confirm: '',
  });

  const isRegister = mode === 'register';
  const isBusiness = variant === 'business';

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isRegister && form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        if (isBusiness) {
          await onRegister({
            business_name: form.business_name.trim(),
            email: form.email.trim(),
            password: form.password,
          });
        } else {
          await onRegister({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password,
          });
        }
      } else if (isBusiness) {
        await onLogin({ email: form.email.trim(), password: form.password });
      } else {
        await onLogin({ email: form.email.trim(), password: form.password });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">{isBusiness ? 'Business portal' : 'Customer account'}</p>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={!isRegister ? 'active' : ''}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Log in
          </button>
          <button
            type="button"
            className={isRegister ? 'active' : ''}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && !isBusiness && (
            <label>
              Full name
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </label>
          )}

          {isRegister && isBusiness && (
            <label>
              Business name
              <input
                name="business_name"
                value={form.business_name}
                onChange={handleChange}
                required
                autoComplete="organization"
              />
            </label>
          )}

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>

          {isRegister && (
            <label>
              Confirm password
              <input
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting
              ? 'Please wait…'
              : isRegister
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>

        {redirectHint && <p className="auth-hint">{redirectHint}</p>}
      </div>
    </div>
  );
}
