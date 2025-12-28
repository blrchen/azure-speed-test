#!/usr/bin/env node

const { readFileSync, writeFileSync, existsSync } = require('node:fs')
const { resolve } = require('node:path')

const projectRoot = resolve(__dirname, '..')
const publicDir = resolve(projectRoot, 'public')
const outputPath = resolve(publicDir, 'sitemap.xml')
const prerenderManifestPath = resolve(
  projectRoot,
  'dist',
  'azure-speed-test',
  'prerendered-routes.json'
)

const baseUrlFromEnv = process.env.SITEMAP_BASE_URL ?? 'https://www.azurespeed.com'
const normalizedBaseUrl = baseUrlFromEnv.replace(/\/+$/, '')

if (!/^https?:\/\//.test(normalizedBaseUrl)) {
  console.error(
    `Invalid base URL "${baseUrlFromEnv}". Expected value to begin with http:// or https://.`
  )
  process.exit(1)
}

if (!existsSync(prerenderManifestPath)) {
  console.error(
    `Prerender manifest not found at ${prerenderManifestPath}. Run the prerender build first.`
  )
  process.exit(1)
}

let prerenderManifest

try {
  prerenderManifest = JSON.parse(readFileSync(prerenderManifestPath, 'utf8'))
} catch (error) {
  console.error(
    `Failed to read routes from ${prerenderManifestPath}: ${(error && error.message) || error}`
  )
  process.exit(1)
}

const discoveredRoutes = prerenderManifest?.routes ?? {}
const routeKeys = Object.keys(discoveredRoutes)

if (routeKeys.length === 0) {
  console.error(`No routes were found in ${prerenderManifestPath}.`)
  process.exit(1)
}

const routes = new Set(routeKeys)

if (!routes.has('/')) {
  routes.add('/')
}

const sortedRoutes = Array.from(routes).sort((a, b) => {
  if (a === b) {
    return 0
  }

  if (a === '/') {
    return -1
  }

  if (b === '/') {
    return 1
  }

  return a.localeCompare(b)
})

const expectedUrls = sortedRoutes.map((route) =>
  route === '/' ? `${normalizedBaseUrl}/` : `${normalizedBaseUrl}${route}`
)
const expectedUrlSet = new Set(expectedUrls)

const urlEntries = expectedUrls
  .map((url) => `  <url>\n    <loc>${encodeURI(url)}</loc>\n  </url>`)
  .join('\n')

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urlEntries,
  '</urlset>',
  ''
].join('\n')

writeFileSync(outputPath, sitemapXml, 'utf8')

const xmlToValidate = sitemapXml

const locMatches = Array.from(xmlToValidate.matchAll(/<loc>(.*?)<\/loc>/g)).map((match) => match[1])

const sitemapUrlSet = new Set(locMatches)

const missingUrls = [...expectedUrlSet].filter((url) => !sitemapUrlSet.has(url))
const extraUrls = [...sitemapUrlSet].filter((url) => !expectedUrlSet.has(url))

if (missingUrls.length > 0 || extraUrls.length > 0) {
  if (missingUrls.length > 0) {
    console.error('Missing URLs:')
    for (const url of missingUrls) {
      console.error(`  ${url}`)
    }
  }

  if (extraUrls.length > 0) {
    console.error('Unexpected URLs:')
    for (const url of extraUrls) {
      console.error(`  ${url}`)
    }
  }

  console.error('Sitemap validation failed.')
  process.exit(1)
}

console.log(`Sitemap written to ${outputPath} with ${expectedUrls.length} entries`)
