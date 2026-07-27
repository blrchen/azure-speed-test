import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router } from '@angular/router'

import {
  buildVmRegionHref,
  buildVmSeriesHref,
  buildVmSkuHref,
  VM_OPERATING_SYSTEMS,
  VM_PRICE_MODES,
  VmCatalogDocument,
  VmComparisonDocument,
  VmFamiliesDocument,
  VmFamilyDetailDocument,
  VmRegionDetailDocument,
  VmRegionsDocument,
  VmSkuDetailDocument,
} from './vm-catalog'
import { VmCatalogLoader } from './vm-catalog-loader'

function notFoundRedirect(router: Router): RedirectCommand {
  return new RedirectCommand(router.parseUrl('/not-found'))
}

export const vmCatalogDirectoryResolver: ResolveFn<VmCatalogDocument> = () =>
  inject(VmCatalogLoader).getDirectory()

export const vmRegionDirectoryResolver: ResolveFn<VmRegionsDocument> = () =>
  inject(VmCatalogLoader).getRegions()

export const vmSeriesDirectoryResolver: ResolveFn<VmFamiliesDocument> = () =>
  inject(VmCatalogLoader).getSeries()

export const vmComparisonResolver: ResolveFn<VmComparisonDocument | RedirectCommand> = async (
  route: ActivatedRouteSnapshot
) => {
  const loader = inject(VmCatalogLoader)
  const router = inject(Router)
  const [catalog, regionDirectory] = await Promise.all([loader.getDirectory(), loader.getRegions()])
  const skuNamesByKey = new Map(catalog.skus.map((sku) => [sku.sku.trim().toLowerCase(), sku.sku]))
  const requestedSkuNames = (route.queryParamMap.get('skus') ?? '')
    .split(',')
    .map((skuName) => skuName.trim())
    .filter(Boolean)
  const selectedSkuNames: string[] = []
  const invalidSkuNames: string[] = []
  const omittedSkuNames: string[] = []
  const seenSkuKeys = new Set<string>()
  for (const requestedSkuName of requestedSkuNames) {
    const skuKey = requestedSkuName.toLowerCase()
    if (seenSkuKeys.has(skuKey)) continue
    seenSkuKeys.add(skuKey)
    const canonicalName = skuNamesByKey.get(skuKey)
    if (!canonicalName) {
      invalidSkuNames.push(requestedSkuName)
    } else if (selectedSkuNames.length >= 3) {
      omittedSkuNames.push(canonicalName)
    } else {
      selectedSkuNames.push(canonicalName)
    }
  }

  const resolvedSkus = await Promise.all(
    selectedSkuNames.map((skuName) => loader.getSkuDetail(skuName))
  )
  if (resolvedSkus.some((sku) => sku === null)) {
    return notFoundRedirect(router)
  }
  const skus = resolvedSkus.filter((sku): sku is VmSkuDetailDocument => sku !== null)

  const requestedOperatingSystem = route.queryParamMap.get('os')?.trim().toLowerCase() ?? ''
  const selectedOperatingSystem =
    VM_OPERATING_SYSTEMS.find(
      (operatingSystem) => operatingSystem.toLowerCase() === requestedOperatingSystem
    ) ?? 'Linux'
  const requestedPriceMode = route.queryParamMap.get('mode')?.trim().toLowerCase() ?? ''
  const selectedPriceMode =
    VM_PRICE_MODES.find((priceMode) => priceMode.toLowerCase() === requestedPriceMode) ??
    'PayAsYouGo'
  const requestedRegionName = route.queryParamMap.get('region')?.trim().toLowerCase() ?? ''
  const requestedRegion = regionDirectory.regions.some(
    (region) => region.armRegionName === requestedRegionName
  )
    ? requestedRegionName
    : ''
  const showDifferencesOnly = route.queryParamMap.get('diff') === '1'

  return {
    catalog,
    regionDirectory,
    skus,
    invalidSkuNames,
    omittedSkuNames,
    selectedOperatingSystem,
    selectedPriceMode,
    requestedRegion,
    showDifferencesOnly,
  }
}

export const vmSeriesDetailResolver: ResolveFn<VmFamilyDetailDocument | RedirectCommand> = async (
  route: ActivatedRouteSnapshot
) => {
  const loader = inject(VmCatalogLoader)
  const router = inject(Router)
  const requestedSlug = route.paramMap.get('seriesSlug')?.trim() ?? ''
  const normalizedSlug = requestedSlug.toLowerCase()
  const data = normalizedSlug ? await loader.getSeriesDetail(normalizedSlug) : null

  if (!data) return notFoundRedirect(router)
  if (requestedSlug !== data.family.routeSlug) {
    return new RedirectCommand(router.parseUrl(buildVmSeriesHref(data.family.series)))
  }
  return data
}

export const vmSkuDetailResolver: ResolveFn<VmSkuDetailDocument | RedirectCommand> = async (
  route: ActivatedRouteSnapshot
) => {
  const loader = inject(VmCatalogLoader)
  const router = inject(Router)
  const requestedName = route.paramMap.get('armSkuName')?.trim() ?? ''
  const data = requestedName ? await loader.getSkuDetail(requestedName) : null

  if (!data) return notFoundRedirect(router)
  if (requestedName !== data.sku.sku) {
    return new RedirectCommand(router.parseUrl(buildVmSkuHref(data.sku.sku)))
  }
  return data
}

export const vmRegionDetailResolver: ResolveFn<VmRegionDetailDocument | RedirectCommand> = async (
  route: ActivatedRouteSnapshot
) => {
  const loader = inject(VmCatalogLoader)
  const router = inject(Router)
  const requestedName = route.paramMap.get('armRegionName')?.trim() ?? ''
  const normalizedName = requestedName.toLowerCase()
  const data = normalizedName ? await loader.getRegionDetail(normalizedName) : null

  if (!data) return notFoundRedirect(router)
  if (requestedName !== normalizedName) {
    return new RedirectCommand(router.parseUrl(buildVmRegionHref(normalizedName)))
  }
  return data
}
