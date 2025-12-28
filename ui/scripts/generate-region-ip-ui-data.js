#!/usr/bin/env node

const { existsSync, readFileSync, writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

const API_URL = 'https://azureiplookup-westus3.azurewebsites.net/api/serviceTagsByRegion'
const projectRoot = resolve(__dirname, '..')
const outputPath = resolve(
  projectRoot,
  'src/app/pages/information/azure-ip-ranges-by-region/region-ip-ranges.data.ts'
)

const METADATA_FILES = [
  'src/assets/data/regions.json',
  'src/assets/data/regions-china.json',
  'src/assets/data/regions-usgov.json'
]

const ADDITIONAL_METADATA = {
  belgiumcentral: {
    displayName: 'Belgium Central',
    geography: 'Belgium',
    regionGroup: 'Western Europe',
    datacenterLocation: 'Brussels'
  },
  brazilne: {
    displayName: 'Brazil Northeast',
    geography: 'Brazil',
    regionGroup: 'South America',
    datacenterLocation: 'Fortaleza'
  },
  brazilse: {
    displayName: 'Brazil Southeast',
    geography: 'Brazil',
    regionGroup: 'South America',
    datacenterLocation: 'Sao Paulo'
  },
  centralfrance: {
    displayName: 'Central France',
    geography: 'France',
    regionGroup: 'Europe',
    datacenterLocation: 'Paris'
  },
  centraluseuap: {
    displayName: 'Central US (EUAP)',
    geography: 'United States',
    regionGroup: 'United States',
    datacenterLocation: 'Iowa'
  },
  chilec: {
    displayName: 'Chile Central',
    geography: 'Chile',
    regionGroup: 'South America',
    datacenterLocation: 'Santiago'
  },
  eastus2euap: {
    displayName: 'East US 2 (EUAP)',
    geography: 'United States',
    regionGroup: 'United States',
    datacenterLocation: 'Virginia'
  },
  germanyn: {
    displayName: 'Germany North',
    geography: 'Germany',
    regionGroup: 'Europe',
    datacenterLocation: 'Berlin'
  },
  germanywc: {
    displayName: 'Germany West Central',
    geography: 'Germany',
    regionGroup: 'Europe',
    datacenterLocation: 'Frankfurt'
  },
  israelnorthwest: {
    displayName: 'Israel Northwest',
    geography: 'Israel',
    regionGroup: 'Middle East',
    datacenterLocation: 'Tel Aviv'
  },
  malaysiasouth: {
    displayName: 'Malaysia South',
    geography: 'Malaysia',
    regionGroup: 'Asia Pacific',
    datacenterLocation: 'Johor Bahru'
  },
  northeurope2: {
    displayName: 'North Europe 2',
    geography: 'Europe',
    regionGroup: 'Northern Europe',
    datacenterLocation: 'Helsinki'
  },
  norwaye: {
    displayName: 'Norway East',
    geography: 'Norway',
    regionGroup: 'Europe',
    datacenterLocation: 'Oslo'
  },
  norwayw: {
    displayName: 'Norway West',
    geography: 'Norway',
    regionGroup: 'Europe',
    datacenterLocation: 'Stavanger'
  },
  southcentralus2: {
    displayName: 'South Central US 2',
    geography: 'United States',
    regionGroup: 'United States',
    datacenterLocation: 'Texas'
  },
  southeastus: {
    displayName: 'Southeast US',
    geography: 'United States',
    regionGroup: 'United States',
    datacenterLocation: 'Georgia'
  },
  southeastus3: {
    displayName: 'Southeast US 3',
    geography: 'United States',
    regionGroup: 'United States',
    datacenterLocation: 'Georgia'
  },
  southfrance: {
    displayName: 'South France',
    geography: 'France',
    regionGroup: 'Europe',
    datacenterLocation: 'Marseille'
  },
  swedensouth: {
    displayName: 'Sweden South',
    geography: 'Sweden',
    regionGroup: 'Europe',
    datacenterLocation: 'Malmo'
  },
  switzerlandn: {
    displayName: 'Switzerland North',
    geography: 'Switzerland',
    regionGroup: 'Europe',
    datacenterLocation: 'Zurich'
  },
  switzerlandw: {
    displayName: 'Switzerland West',
    geography: 'Switzerland',
    regionGroup: 'Europe',
    datacenterLocation: 'Geneva'
  },
  taiwannorth: {
    displayName: 'Taiwan North',
    geography: 'Taiwan',
    regionGroup: 'Asia Pacific',
    datacenterLocation: 'Taipei'
  },
  taiwannorthwest: {
    displayName: 'Taiwan Northwest',
    geography: 'Taiwan',
    regionGroup: 'Asia Pacific',
    datacenterLocation: 'Hsinchu'
  },
  usgoviowa: {
    displayName: 'US Gov Iowa',
    geography: 'USGov',
    regionGroup: 'United States Government',
    datacenterLocation: 'Iowa'
  },
  usstagec: {
    displayName: 'US Stage Central',
    geography: 'United States',
    regionGroup: 'United States',
    datacenterLocation: 'Iowa'
  },
  usstagee: {
    displayName: 'US Stage East',
    geography: 'United States',
    regionGroup: 'United States',
    datacenterLocation: 'Virginia'
  }
}

const indent = (level) => '  '.repeat(level)

const escapeValue = (value) => `${value}`.replace(/'/g, "\\'")

const formatEntry = (entry) => {
  const lines = [
    `${indent(1)}{`,
    `${indent(2)}regionId: '${escapeValue(entry.regionId)}',`,
    `${indent(2)}displayName: '${escapeValue(entry.displayName)}',`,
    `${indent(2)}regionGroup: '${escapeValue(entry.regionGroup)}',`,
    `${indent(2)}geography: '${escapeValue(entry.geography)}',`,
    `${indent(2)}datacenterLocation: '${escapeValue(entry.datacenterLocation)}',`,
    `${indent(2)}serviceTagId: '${escapeValue(entry.serviceTagId)}'`,
    `${indent(1)}}`
  ]
  return lines.join('\n')
}

const buildFileContents = (entries) => {
  const headerComment = `// Auto-generated by scripts/generate-region-ip-ui-data.js on ${new Date().toISOString()}\n// Source: ${API_URL}\n`
  const interfaceDeclaration =
    'export interface RegionIpRangeEntry {\n' +
    `${indent(1)}regionId: string\n` +
    `${indent(1)}displayName: string\n` +
    `${indent(1)}regionGroup: string\n` +
    `${indent(1)}geography: string\n` +
    `${indent(1)}datacenterLocation: string\n` +
    `${indent(1)}serviceTagId: string\n` +
    '}\n'

  const directoryBlock = `export const REGION_IP_RANGE_DIRECTORY: RegionIpRangeEntry[] = [\n${entries
    .map(formatEntry)
    .join(',\n')}\n]\n`

  return `${headerComment}\n${interfaceDeclaration}\n${directoryBlock}`
}

const loadMetadata = () => {
  const map = new Map()

  for (const relativePath of METADATA_FILES) {
    const filePath = resolve(projectRoot, relativePath)
    if (!existsSync(filePath)) {
      continue
    }

    const data = JSON.parse(readFileSync(filePath, { encoding: 'utf8' }))
    for (const region of data) {
      if (region?.regionId) {
        map.set(region.regionId.toLowerCase(), region)
      }
    }
  }

  for (const [regionId, metadata] of Object.entries(ADDITIONAL_METADATA)) {
    map.set(regionId.toLowerCase(), {
      regionId,
      displayName: metadata.displayName,
      geography: metadata.geography,
      regionGroup: metadata.regionGroup,
      datacenterLocation: metadata.datacenterLocation
    })
  }

  return map
}

const fetchRegionTags = async () => {
  const response = await fetch(API_URL, {
    headers: {
      'User-Agent': 'azure-speed-test/cli'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch region service tags (HTTP ${response.status})`)
  }

  return response.json()
}

const toEntry = (serviceTagId, metadataMap) => {
  const parts = `${serviceTagId}`.split('.')
  const regionId = (parts[1] ?? serviceTagId).toLowerCase()
  const metadata = metadataMap.get(regionId) ?? {}

  const displayName = metadata.displayName ?? `Region ${regionId}`
  const regionGroup = metadata.regionGroup ?? 'Independent regions'
  const geography = metadata.geography ?? 'Global'
  const datacenterLocation = metadata.datacenterLocation ?? ''

  return {
    regionId,
    displayName,
    regionGroup,
    geography,
    datacenterLocation,
    serviceTagId
  }
}

const writeOutput = (contents) => {
  writeFileSync(outputPath, contents, { encoding: 'utf8' })
  console.log(`Region IP ranges updated (${outputPath})`)
}

const run = async () => {
  try {
    const metadataMap = loadMetadata()
    const serviceTags = await fetchRegionTags()
    const entries = Array.from(
      new Map(
        serviceTags
          .map((serviceTagId) => toEntry(serviceTagId, metadataMap))
          .map((entry) => [entry.regionId, entry])
      ).values()
    ).sort((a, b) => a.displayName.localeCompare(b.displayName))

    const fileContents = buildFileContents(entries)
    const existingContents = existsSync(outputPath)
      ? readFileSync(outputPath, { encoding: 'utf8' })
      : null

    if (existingContents === fileContents) {
      console.log('Region IP ranges are already up to date.')
      return
    }

    writeOutput(fileContents)
  } catch (error) {
    console.error('[region-ip-ranges] Unable to refresh data:', error.message)

    if (!existsSync(outputPath)) {
      process.exitCode = 1
      console.error(
        '[region-ip-ranges] No existing data file found; aborting to avoid empty dataset.'
      )
    } else {
      console.warn(
        '[region-ip-ranges] Continuing with existing data. Rerun the generator when network access is restored.'
      )
    }
  }
}

run()
