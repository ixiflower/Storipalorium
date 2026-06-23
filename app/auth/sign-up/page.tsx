'use client';

import { useActionState } from 'react';
import { signUpWithEmail } from './actions';
import Link from 'next/link';

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 md:mx-auto p-16 md:p-20 border-secondary border-t border-l border-r-6 border-b-6">
        <div className="space-y-8">
          <div className="text-3xl md:text-4xl text-foreground">Sign Up</div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <label className="text-foreground">Name</label>
              <input
                name="name"
                type="text"
                required
                className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14"
              />
            </div>
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

            <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 sm:gap-6 pt-4">
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
                {pending ? 'CREATING...' : 'SIGN UP'}
              </button>
            </div>
          </form>

          <div className="text-center text-foreground/60 text-sm pt-4">
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="text-accent hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
