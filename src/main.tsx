import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans';
import './index.css';
import '@/styles/app.css';
import App from './App';
import { startSimulation } from '@/services/simulation';

// PrintEase's status-progression engine lives outside React so StrictMode
// double-effects can never duplicate it.
startSimulation();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
