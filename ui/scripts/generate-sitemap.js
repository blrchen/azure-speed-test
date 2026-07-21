#!/usr/bin/env node

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs')
const { dirname, resolve } = require('node:path')

const projectRoot = resolve(__dirname, '..')
const projectName = 'azure-speed-test'
const siteOrigin = 'https://www.azurespeed.com'
const ignoredPrerenderRoutes = [
  '/',
  '/Azure',
  '/Information',
  '/Information/AzureIpRanges',
  '/not-found',
]
const publicOutputPath = resolve(projectRoot, 'public', 'sitemap.xml')
const browserOutputPath = resolve(projectRoot, 'dist', projectName, 'browser', 'sitemap.xml')
const prerenderManifestPath = resolve(projectRoot, 'dist', projectName, 'prerendered-routes.json')
const vmCatalogRoutesPath = resolve(projectRoot, 'public', 'vm-catalog', 'routes.json')

function fail(message) {
  console.error(message)
  process.exit(1)
}

function normalizeRoute(route) {
  if (typeof route !== 'string' || route.length === 0) {
    throw new Error(`Invalid route value: ${route}`)
  }

  const normalized = route.startsWith('/') ? route : `/${route}`
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized
}

function uniqueSortedRoutes(routes) {
  return Array.from(new Set(routes.map(normalizeRoute))).sort((a, b) => a.localeCompare(b))
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeBaseUrl(value) {
  const normalized = value.replace(/\/+$/, '')

  if (!/^https?:\/\//.test(normalized)) {
    throw new Error(`Invalid base URL "${value}". Expected http:// or https://.`)
  }

  return normalized
}

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function readPrerenderManifest() {
  if (!existsSync(prerenderManifestPath)) {
    fail(`Prerender manifest not found at ${prerenderManifestPath}. Run ng build first.`)
  }

  try {
    const manifest = JSON.parse(readFileSync(prerenderManifestPath, 'utf8'))

    if (!isRecord(manifest) || !isRecord(manifest.routes)) {
      fail(`Prerender manifest at ${prerenderManifestPath} must contain routes.`)
    }

    return manifest
  } catch (error) {
    fail(
      `Failed to read routes from ${prerenderManifestPath}: ${(error && error.message) || error}`
    )
  }
}

function getNoindexVmRegionRoutes() {
  if (!existsSync(vmCatalogRoutesPath)) return []

  try {
    const manifest = JSON.parse(readFileSync(vmCatalogRoutesPath, 'utf8'))
    if (!isRecord(manifest) || !Array.isArray(manifest.regions)) {
      throw new Error('regions must be an array')
    }

    return manifest.regions
      .filter((region) => isRecord(region) && region.indexable === false)
      .map((region) => {
        if (typeof region.armRegionName !== 'string' || region.armRegionName.length === 0) {
          throw new Error('a noindex region is missing armRegionName')
        }
        return `/AzureVmPricing/Regions/${encodeURIComponent(region.armRegionName)}`
      })
  } catch (error) {
    fail(
      `Failed to read noindex VM regions from ${vmCatalogRoutesPath}: ${(error && error.message) || error}`
    )
  }
}

function getSitemapRoutesFromPrerenderManifest(prerenderManifest) {
  const prerenderRoutes = uniqueSortedRoutes(Object.keys(prerenderManifest.routes))

  if (prerenderRoutes.length === 0) {
    fail(`No routes were found in ${prerenderManifestPath}.`)
  }

  const ignoredSet = new Set(
    uniqueSortedRoutes([...ignoredPrerenderRoutes, ...getNoindexVmRegionRoutes()])
  )
  const sitemapRoutes = prerenderRoutes.filter((route) => !ignoredSet.has(route))

  if (sitemapRoutes.length === 0) {
    fail(`No sitemap routes remain after filtering ignored routes from ${prerenderManifestPath}.`)
  }

  return sitemapRoutes
}

function buildSitemapXml(baseUrl, routes) {
  const urlEntries = routes
    .map((route) => {
      const url = new URL(route, `${baseUrl}/`).href
      return `  <url>\n    <loc>${xmlEscape(url)}</loc>\n  </url>`
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
    '',
  ].join('\n')
}

function readExistingSitemapRoutes() {
  if (!existsSync(publicOutputPath)) return []

  const sitemapXml = readFileSync(publicOutputPath, 'utf8')
  const routes = []
  for (const match of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      routes.push(new URL(match[1]).pathname)
    } catch {
      fail(`Existing sitemap contains an invalid URL: ${match[1]}`)
    }
  }
  return uniqueSortedRoutes(routes)
}

function assertNoUnexpectedRouteRemovals(nextRoutes) {
  if (process.env.ALLOW_SITEMAP_ROUTE_REMOVALS === '1') return

  const nextRouteSet = new Set(nextRoutes)
  const removedRoutes = readExistingSitemapRoutes().filter((route) => !nextRouteSet.has(route))
  if (removedRoutes.length === 0) return

  const preview = removedRoutes.slice(0, 20).join('\n  ')
  const remainder = removedRoutes.length > 20 ? `\n  ...and ${removedRoutes.length - 20} more` : ''
  fail(
    `Refusing to remove ${removedRoutes.length} existing sitemap route(s):\n  ${preview}${remainder}\nSet ALLOW_SITEMAP_ROUTE_REMOVALS=1 only for an intentional, reviewed URL removal.`
  )
}

function writeFileEnsuringDirectory(path, contents) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents, 'utf8')
}

function generateSitemap() {
  const baseUrl = normalizeBaseUrl(process.env.SITEMAP_BASE_URL ?? siteOrigin)
  const prerenderManifest = readPrerenderManifest()
  const sitemapRoutes = getSitemapRoutesFromPrerenderManifest(prerenderManifest)
  assertNoUnexpectedRouteRemovals(sitemapRoutes)

  const sitemapXml = buildSitemapXml(baseUrl, sitemapRoutes)

  writeFileEnsuringDirectory(publicOutputPath, sitemapXml)
  writeFileEnsuringDirectory(browserOutputPath, sitemapXml)

  console.log(
    `Sitemap written to ${publicOutputPath} and ${browserOutputPath} with ${sitemapRoutes.length} entries`
  )
}

if (require.main === module) {
  try {
    generateSitemap()
  } catch (error) {
    fail((error && error.message) || String(error))
  }
}

module.exports = { assertNoUnexpectedRouteRemovals, generateSitemap }
