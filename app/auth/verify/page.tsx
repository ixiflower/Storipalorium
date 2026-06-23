'use client';

import React, { Suspense, useActionState, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyOtp } from './actions';
import Link from 'next/link';

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background text-foreground">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [state, formAction, pending] = useActionState(verifyOtp, null);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(index: number, e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const target = Math.min(pasted.length, 5);
    refs.current[target]?.focus();
  }

  if (!email) {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 md:mx-auto p-16 md:p-20 border-secondary border-t border-l border-r-6 border-b-6">
          <div className="space-y-8">
            <div className="text-3xl md:text-4xl text-foreground">Missing Email</div>
            <div className="text-foreground/60 text-sm">
              No email was provided. Please sign up first.
            </div>
            <Link
              href="/auth/sign-up"
              className="inline-block px-10 sm:px-8 py-4 sm:py-3 text-lg sm:text-xl text-foreground border-secondary border-t border-l border-r-6 border-b-6"
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 md:mx-auto p-16 md:p-20 border-secondary border-t border-l border-r-6 border-b-6">
        <div className="space-y-8">
          <div className="text-3xl md:text-4xl text-foreground">Check Your Email</div>

          <div className="text-foreground/60 text-sm">
            A verification code was sent to <span className="text-foreground">{email}</span>.
            Enter the code below.
          </div>

          <form action={formAction} className="space-y-6">
            <input type="hidden" name="otp" value={digits.join('')} />

            <div className="space-y-4">
              <label className="text-foreground mb-4 block">Verification Code</label>
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {digits.map((d, i) => (
                  <React.Fragment key={i}>
                    {i === 3 && <span className="text-foreground/40 text-2xl -mt-1">-</span>}
                    <input
                      ref={(el) => { refs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      required
                      value={d}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={(e) => handlePaste(i, e)}
                      className="w-11 sm:w-13 h-14 bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 text-xl text-center"
                    />
                  </React.Fragment>
                ))}
              </div>
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
                {pending ? 'VERIFYING...' : 'VERIFY'}
              </button>
            </div>
          </form>

          <div className="text-center text-foreground/60 text-sm pt-4">
            Didn&apos;t receive a code?{' '}
            <span className="text-accent cursor-not-allowed">Resend</span>
          </div>
        </div>
      </div>
    </div>
  );
}