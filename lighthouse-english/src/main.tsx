import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { SpeechProvider } from './hooks/SpeechContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpeechProvider>
      <App />
    </SpeechProvider>
  </StrictMode>
);
