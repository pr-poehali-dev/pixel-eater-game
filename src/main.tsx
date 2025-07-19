import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import '@fontsource/orbitron/400.css'
import '@fontsource/orbitron/700.css'

createRoot(document.getElementById("root")!).render(<App />);