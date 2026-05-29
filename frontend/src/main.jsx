import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'light') {
  document.documentElement.classList.remove('dark')
} else {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'font-display text-sm',
        style: {
          background: '#111827',
          color: '#f1f5f9',
          border: '1px solid rgba(0,245,255,0.2)',
        },
        success: { iconTheme: { primary: '#39ff14', secondary: '#111827' } },
        error: { iconTheme: { primary: '#ff375f', secondary: '#111827' } },
      }}
    />
  </React.StrictMode>,
)
