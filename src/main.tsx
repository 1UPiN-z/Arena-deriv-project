import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ensureBootstrap } from './db/db';

// apply saved theme before first paint
const saved = (localStorage.getItem('deriv-demo-theme') as 'light' | 'dark') ?? 'light';
document.documentElement.classList.toggle('dark', saved === 'dark');

void ensureBootstrap();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
