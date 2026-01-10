import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill process.env for browser environments
// This ensures the Gemini SDK can access the API Key via process.env.API_KEY
if (typeof window !== 'undefined') {
  const win = window as any;
  if (!win.process) {
    win.process = { env: {} };
  }
  if (!win.process.env) {
    win.process.env = {};
  }
  // Inject the API Key provided
  win.process.env.API_KEY = 'AIzaSyCTOFxTz98HAdVqOeCgSKdmzJFITOCtXro';
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);