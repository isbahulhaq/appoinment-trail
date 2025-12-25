
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

console.log("MedQueue Pro: Initializing entry point...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("MedQueue Pro: Root element not found");
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
console.log("MedQueue Pro: React mounted with Error Boundary");
