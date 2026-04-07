import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> causes duplicate mounts which interferes with socket joining/leaving
  // so we keep it off for smoother MVP socket experience
    <App />
)