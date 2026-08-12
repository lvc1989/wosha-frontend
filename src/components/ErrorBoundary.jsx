import React from "react";

const C = { ink: "#0B1B33", cyan: "#2B6CF6", bg: "#F5F7FA", border: "#E4E7EC", textSoft: "#667085" };

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Caught by ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg }}>
        <div style={{ background: "#fff", border: `1px solid ${C.border}` }} className="w-full max-w-sm rounded-2xl p-7 text-center">
          <div style={{ color: C.ink }} className="text-lg font-bold mb-2">Something went wrong on this page</div>
          <div style={{ color: C.textSoft }} className="text-sm mb-5">The rest of the app is fine — this page just hit an unexpected error. Try reloading, or go back to the dashboard.</div>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} style={{ border: `1px solid ${C.border}`, color: C.ink }} className="flex-1 text-sm font-semibold py-2 rounded-lg">Reload</button>
            <button onClick={() => { this.setState({ hasError: false }); window.location.href = "/"; }} style={{ background: C.cyan }} className="flex-1 text-white text-sm font-semibold py-2 rounded-lg">Go to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }
}
