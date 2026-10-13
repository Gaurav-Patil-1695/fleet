import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { DepotProvider } from './context/DepotContext';
import AppRouter from './router/AppRouter';
import './styles/tokens.css';
import './styles/global.css';
import './styles/utilities.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DepotProvider>
        <AppRouter />
      </DepotProvider>
    </AuthProvider>
  );
};

export default App;
