import { lazy, Suspense } from 'react'
import { useRouteError, type RouteObject } from 'react-router-dom'
import { ErrorFallback } from './components/ErrorBoundary'
import { Loading } from './components/ui/States'
import { SiteLayout } from './layouts/SiteLayout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'))
const CorporateTrainingPage = lazy(() => import('./pages/CorporateTrainingPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'))
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))

function RouteError() {
  return <ErrorFallback error={useRouteError()} />
}

/** Shared by the browser router (App.tsx) and the prerenderer (entry-server.tsx). */
export const routes: RouteObject[] = [
  {
    element: <SiteLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/services/:slug', element: <ServiceDetailPage /> },
      { path: '/courses', element: <CoursesPage /> },
      { path: '/courses/:slug', element: <CourseDetailPage /> },
      { path: '/corporate-training', element: <CorporateTrainingPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/knowledge', element: <KnowledgePage /> },
      { path: '/knowledge/:slug', element: <ArticlePage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:slug', element: <ProjectDetailPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <Suspense fallback={<Loading />}>
        <AdminPage />
      </Suspense>
    ),
  },
]
