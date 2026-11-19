'use client';

import React from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class FirestoreErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected database error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-12 max-w-lg rounded-3xl border border-red-300/70 bg-white/95 p-6 text-center shadow-lg dark:border-red-500/30 dark:bg-[#17121C]">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-extrabold text-[#191116] dark:text-white">
            Sync Interrupted
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[#64535C] dark:text-[#A696A1]">
            Could not complete a database request. Please refresh or sign in again.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl whisper-gradient px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
