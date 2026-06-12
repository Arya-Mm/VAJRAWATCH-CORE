/**
 * ErrorBoundary — Phase 4
 * Class component — hooks are not allowed in error boundaries.
 * Wraps individual intel panel components.
 * On error: logs to console, shows a minimal fallback card.
 * Children continue to render normally when no error is present.
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

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback" role="alert" aria-label="Component error — displaying cached values">
          <span className="error-fallback__icon" aria-hidden="true">⚠</span>
          <span className="error-fallback__text">
            Displaying cached values
          </span>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
