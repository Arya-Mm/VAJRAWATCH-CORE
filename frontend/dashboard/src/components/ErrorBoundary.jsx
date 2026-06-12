/**
 * ErrorBoundary — Phase 4 + Hardening
 * Adds a Retry button: resets state so the child re-mounts.
 * Works correctly after Demo Mode resets (no permanent error state).
 */

import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, errorMsg: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error, info) {
    console.error('[VAJRAWATCH] Component error caught by ErrorBoundary:', error);
    console.error('[VAJRAWATCH] Component stack:', info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMsg: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="error-fallback"
          role="alert"
          aria-label="Component error — displaying cached values"
        >
          <span className="error-fallback__icon" aria-hidden="true">⚠</span>
          <span className="error-fallback__text">Displaying cached values</span>
          <button
            className="error-fallback__retry"
            onClick={this.handleRetry}
            aria-label="Retry loading this component"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
