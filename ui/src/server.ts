import { join } from 'node:path'
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const browserDistFolder = join(import.meta.dirname, '../browser')

const app = express()
const angularApp = new AngularNodeAppEngine()

/**
 * Legacy URL redirects (301 permanent)
 * These preserve SEO and handle old bookmarks
 */
const legacyRedirects: Record<string, string> = {
  '/Cloud/RegionFinder': '/Azure/IPLookup',
  '/ChatGPT/AppList': '/ChatGPT/WritingAssistant',
  '/Information/AzureIpRanges': '/Information/AzureIpRanges/AzureCloud',
  '/Information/IpRange': '/Information/AzureIpRanges/AzureCloud'
}

app.use((req, res, next) => {
  const redirect = legacyRedirects[req.path]
  if (redirect) {
    return res.redirect(301, redirect)
  }
  next()
})

/**
 * Proxy /api requests to .NET backend
 */
app.use(
  '/api',
  createProxyMiddleware({
    target: 'http://localhost:8080',
    changeOrigin: true,
    // Express strips the mount path, so we need to prefix /api back before forwarding
    pathRewrite: (path) => `/api${path}`
  })
)

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false
  })
)

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next)
})

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000
  app.listen(port, (error) => {
    if (error) {
      throw error
    }

    console.log(`Node Express server listening on http://localhost:${port}`)
  })
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app)
