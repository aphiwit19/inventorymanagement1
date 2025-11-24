import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { seedIfNeeded } from './services/seed';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Seed demo data into localStorage on first load
if (process.env.REACT_APP_USE_LOCAL_DEMO === 'true') {
  seedIfNeeded();
}

const theme = extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: false,
});

root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
