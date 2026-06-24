'use client';

import { useActionState } from 'react';
import { signInWithEmail } from '@/app/auth/sign-in/actions';
import { authClient } from '@/lib/auth/client';
import Link from 'next/link';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 md:mx-auto p-16 md:p-20 border-secondary border-t border-l border-r-6 border-b-6">
        <div className="space-y-8">
          <div className="text-3xl md:text-4xl text-foreground">Login</div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full px-6 py-4 text-xl text-foreground border-accent border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-secondary" />
            <span className="text-foreground/40 text-sm">or</span>
            <div className="flex-1 border-t border-secondary" />
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <label className="text-foreground">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14"
              />
            </div>
            <div className="space-y-4">
              <label className="text-foreground">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14"
              />
            </div>

            {state?.error && (
              <div className="text-destructive text-sm">{state.error}</div>
            )}

            <div className="mt-10 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 sm:gap-6">
              <Link
                href="/"
                className="w-full sm:w-auto px-10 sm:px-8 py-4 sm:py-3 text-lg sm:text-xl text-foreground text-center border-foreground border-t border-l border-r-6 border-b-6"
              >
                CANCEL
              </Link>
              <button
                type="submit"
                disabled={pending}
                className="w-full sm:w-auto px-10 sm:px-8 py-4 sm:py-3 text-lg sm:text-xl text-foreground border-secondary border-t border-l border-r-6 border-b-6 disabled:opacity-50"
              >
                {pending ? 'SIGNING IN...' : 'LOGIN'}
              </button>
            </div>
          </form>

          <div className="text-center text-foreground/60 text-sm pt-4">
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="text-accent hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
