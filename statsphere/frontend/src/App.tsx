import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SiteProvider } from './hooks/useSite'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export default function App() {
  return (
    <ErrorBoundary>
      <SiteProvider>
        <RouterProvider router={router} />
      </SiteProvider>
    </ErrorBoundary>
  )
}
