import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    let display = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error) {
        display = `Permission or data error (${parsed.operationType || 'read'}): ${parsed.error}`;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: display };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Studio ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070709] text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111115] border border-zinc-800 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#D4AF37] flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-semibold text-white">Something went wrong</h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c455] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Studio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
