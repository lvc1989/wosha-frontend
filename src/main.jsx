import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// The static splash in index.html did its job (instant paint, no blank flash) —
// React has now mounted its own loading screen underneath it, so it's safe to
// remove. requestAnimationFrame instead of doing it synchronously above ensures
// React's first real paint has actually happened first, so there's no gap.
requestAnimationFrame(() => {
  document.getElementById("wosha-boot-splash")?.remove();
});
