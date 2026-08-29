'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '@/app/actions/auth';

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} noValidate>
      {state?.error && (
        <div className="login-error" role="alert">
          {state.error}
        </div>
      )}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@example.com"
        />
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      <button type="submit" className="btn btn-primary btn-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
