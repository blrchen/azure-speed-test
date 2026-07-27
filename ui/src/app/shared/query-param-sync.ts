import { Location } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'

/** Query params to merge into the current URL; `null` removes a param. */
export type MergeableQueryParams = Record<string, string | null>

export interface QueryParamSyncContext {
  readonly router: Router
  readonly route: ActivatedRoute
  readonly location: Location
}

/**
 * Replaces the current history entry when `nextQueryParams` differs from
 * `currentQueryParams`, merging into existing params and preserving the
 * fragment. Filter pages keep their own `buildQueryParams`, which decides
 * default omission and param naming; only the compare-and-replace shell is
 * shared.
 */
export function replaceMergedQueryParamsIfChanged(
  context: QueryParamSyncContext,
  nextQueryParams: MergeableQueryParams,
  currentQueryParams: MergeableQueryParams
): void {
  if (JSON.stringify(nextQueryParams) === JSON.stringify(currentQueryParams)) return

  const urlTree = context.router.createUrlTree([], {
    relativeTo: context.route,
    queryParams: nextQueryParams,
    queryParamsHandling: 'merge',
    preserveFragment: true,
  })
  context.location.replaceState(context.router.serializeUrl(urlTree))
}
