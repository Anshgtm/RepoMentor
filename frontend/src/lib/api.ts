import axios from 'axios'

function resolveApiUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (configured) return configured

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') return `${protocol}//${hostname}:8000`

    // Hosted workspace previews expose services using matching port subdomains.
    const backendHost = hostname.replace(/-port-\d+(?=\.)/, '-port-8000')
    if (backendHost !== hostname) return `${protocol}//${backendHost}`
  }

  return 'http://localhost:8000'
}

const configuredUrl = resolveApiUrl().replace(/\/$/, '')
const baseURL = configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`

export const api = axios.create({ baseURL })
