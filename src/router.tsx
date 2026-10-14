import {
  createRouter as createTanStackRouter,
  parseSearchWith,
  stringifySearchWith,
} from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    // the page scrolls inside the browser window's card, not the window
    scrollToTopSelectors: ['[data-browser-content]'],
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    // search params stay plain text, like a real site's. the default json-encodes
    // anything that looks like json, so a yail search for 2026 became ?q=%222026%22
    parseSearch: parseSearchWith((value) => value),
    stringifySearch: stringifySearchWith(JSON.stringify),
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
