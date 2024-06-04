import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './components/useAuth';
import './fonts/LXGWWenKaiTC-Light.ttf';
import './fonts/LXGWWenKaiTC-Bold.ttf';
import './fonts/LXGWWenKaiTC-Regular.ttf';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
  <AuthProvider>
    <App />
  </AuthProvider>
  </React.StrictMode>
  ,
  document.getElementById('root')
);
