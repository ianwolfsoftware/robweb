import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Site } from './site';
import { normalisePath } from './content';
import '@fontsource-variable/host-grotesk';
import '@fontsource/playfair-display/latin-400-italic.css';
import 'lenis/dist/lenis.css';
import './styles.css';

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode><Site path={normalisePath(window.location.pathname)} /></StrictMode>,
);
