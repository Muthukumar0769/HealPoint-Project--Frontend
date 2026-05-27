import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
  <StrictMode>
     <Toaster
      position="top-right"
      reverseOrder={false}
    />
    <App />
  </StrictMode>
  </BrowserRouter>
)
