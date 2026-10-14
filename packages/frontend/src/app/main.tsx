// app entry point: createRoot + <StrictMode> + app/providers/AppProviders (Query/Auth/Router) + app/styles/index.css import. See plan Step 6/7.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './providers/AppProviders';
import './styles/index.css';

const rootElement = document.getElementById('root')!;

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
