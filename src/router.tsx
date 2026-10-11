import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { transitionTypes } from './lib/view-transition'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    // also applies to the browser back/forward buttons
    defaultViewTransition: { types: transitionTypes },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
