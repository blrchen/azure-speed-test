import { inject } from '@angular/core'
import { ActivatedRouteSnapshot, RedirectCommand, ResolveFn, Router } from '@angular/router'

import { ServiceTagsLoader } from './service-tags-loader.service'
import {
  normalizeServiceTagCloud,
  normalizeServiceTagIdInput,
  ServiceTagPageRouteData,
  ServiceTagRegionDirectories,
  ServiceTagServiceDirectories,
} from './service-tags-snapshot'

function notFoundRedirect(router: Router): RedirectCommand {
  return new RedirectCommand(router.parseUrl('/not-found'))
}

export const azureIpRangesResolver: ResolveFn<ServiceTagPageRouteData | RedirectCommand> = async (
  route: ActivatedRouteSnapshot
) => {
  const loader = inject(ServiceTagsLoader)
  const router = inject(Router)
  const cloudParam = route.paramMap.get('cloud')
  const legacyRoute = cloudParam === null
  const cloud = normalizeServiceTagCloud(cloudParam ?? undefined)
  const serviceTagId = normalizeServiceTagIdInput(route.paramMap.get('serviceTagId') ?? undefined)

  try {
    const data = legacyRoute
      ? await loader.getLegacyServiceTagPageData(serviceTagId)
      : await loader.getServiceTagPageData(cloud, serviceTagId)
    return data ? { ...data, legacyRoute } : notFoundRedirect(router)
  } catch {
    return {
      error: 'Service tag data could not be loaded. Check your connection and try again.',
      cloud,
      legacyRoute,
    }
  }
}

export const azureIpRangesRegionDirectoryResolver: ResolveFn<
  ServiceTagRegionDirectories | null
> = async () => {
  const loader = inject(ServiceTagsLoader)

  try {
    return await loader.getRegionDirectories()
  } catch {
    return null
  }
}

export const azureIpRangesServiceDirectoryResolver: ResolveFn<
  ServiceTagServiceDirectories | null
> = async () => {
  const loader = inject(ServiceTagsLoader)

  try {
    return await loader.getServiceDirectories()
  } catch {
    return null
  }
}
