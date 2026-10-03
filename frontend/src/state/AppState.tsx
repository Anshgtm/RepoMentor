import { createContext, useContext, useEffect, useReducer } from 'react'

type Theme = 'dark' | 'light'
type Action = { type: 'select-workspace'; id: string } | { type: 'clear-selection' } | { type: 'set-theme'; theme: Theme } | { type: 'set-auth'; email: string } | { type: 'clear-auth' }
type State = { selectedWorkspaceId?: string; theme: Theme; authEmail?: string }
type ContextValue = { state: State; dispatch: React.Dispatch<Action> }

const StateContext = createContext<ContextValue | null>(null)

function reducer(state: State, action: Action): State {
  if (action.type === 'select-workspace') return { ...state, selectedWorkspaceId: action.id }
  if (action.type === 'set-theme') return { ...state, theme: action.theme }
  if (action.type === 'set-auth') return { ...state, authEmail: action.email }
  if (action.type === 'clear-auth') return { ...state, authEmail: undefined }
  return { ...state, selectedWorkspaceId: undefined }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ theme: (localStorage.getItem('repository-guide-theme') as Theme) || 'dark', authEmail: localStorage.getItem('repository-guide-email') || undefined }))
  useEffect(() => { document.documentElement.classList.toggle('light', state.theme === 'light'); localStorage.setItem('repository-guide-theme', state.theme) }, [state.theme])
  useEffect(() => { if (state.authEmail) localStorage.setItem('repository-guide-email', state.authEmail); else localStorage.removeItem('repository-guide-email') }, [state.authEmail])
  return <StateContext.Provider value={{ state, dispatch }}>{children}</StateContext.Provider>
}

export function useAppState() {
  const value = useContext(StateContext)
  if (!value) throw new Error('useAppState must be used inside AppStateProvider')
  return value
}
