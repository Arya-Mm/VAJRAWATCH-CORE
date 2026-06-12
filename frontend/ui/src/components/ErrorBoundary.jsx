import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("WebGL/Canvas Error caught by ErrorBoundary:", error, errorInfo);
    if (this.props.onError) {
      // Use setTimeout to ensure we don't dispatch a state update to a parent
      // component while React is in the middle of a render phase.
      setTimeout(() => this.props.onError(error, errorInfo), 0);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%', background: '#0a0f1e', gap: '1rem'
        }}>
          <AlertTriangle size={28} color="#ef4444" style={{ opacity: 0.8 }} />
          <p style={{
            fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#475569'
          }}>
            Renderer Offline
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
