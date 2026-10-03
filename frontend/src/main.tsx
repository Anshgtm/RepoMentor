import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import '@xyflow/react/dist/style.css'
import './styles.css'
import { queryClient } from './lib/queryClient'
import { AppStateProvider } from './state/AppState'
import { HomePage } from './pages/HomePage'
import { NewWorkspacePage } from './pages/NewWorkspacePage'
import { WorkspacePage } from './pages/WorkspacePage'
import { SettingsPage } from './pages/SettingsPage'
import { AuthPage } from './pages/AuthPage'
import { MyWorkspacePage } from './pages/MyWorkspacePage'
import { PrivacyPage, TermsPage } from './pages/LegalPage'

function App() {
  return <QueryClientProvider client={queryClient}><AppStateProvider><BrowserRouter><Routes><Route path="/" element={<HomePage/>}/><Route path="/new" element={<NewWorkspacePage/>}/><Route path="/workspace/:id" element={<WorkspacePage/>}/><Route path="/my-workspace" element={<MyWorkspacePage/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="/privacy" element={<PrivacyPage/>}/><Route path="/terms" element={<TermsPage/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/signup" element={<AuthPage mode="signup"/>}/></Routes></BrowserRouter></AppStateProvider></QueryClientProvider>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)
