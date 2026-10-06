import React from 'react';

export default class AppErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Application render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-sm p-7 text-center">
            <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-destructive mt-3 break-words">{this.state.error.message}</p>
            <button className="mt-6 bg-foreground text-background px-5 py-3 text-xs font-semibold uppercase tracking-wider rounded-sm" onClick={() => window.location.assign('/')}>Return to dashboard</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
