import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/views.css';
import './styles/charts.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
