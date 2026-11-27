import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

registerSW({
  immediate: true,
  onRegisterError(err) {
    console.warn('Service worker registration skipped:', err);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
