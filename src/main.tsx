import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Site } from './site';
import { normalisePath } from './content';
import './styles.css';

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode><Site path={normalisePath(window.location.pathname)} /></StrictMode>,
);
