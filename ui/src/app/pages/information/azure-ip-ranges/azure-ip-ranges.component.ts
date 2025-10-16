import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { SeoService } from '../../../services'
import { HttpClient } from '@angular/common/http'
import { of, Subject } from 'rxjs'
import { catchError, switchMap, takeUntil } from 'rxjs/operators'

interface IpAddressPrefix {
  serviceTagId: string
  ipAddressPrefixes: string[]
}

@Component({
  selector: 'app-azure-ip-ranges',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './azure-ip-ranges.component.html',
  styleUrls: ['./azure-ip-ranges.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AzureIpRangesComponent implements OnInit, OnDestroy {
  readonly tableData = signal<IpAddressPrefix | undefined>(undefined)
  readonly serviceTagId = signal('AzureCloud')
  readonly isLoading = signal(false)

  private route = inject(ActivatedRoute)
  private seoService = inject(SeoService)
  private http = inject(HttpClient)
  private destroy$ = new Subject<void>()

  ngOnInit() {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const paramServiceTagId = params.get('serviceTagId')
          const nextServiceTagId = paramServiceTagId ? paramServiceTagId : 'AzureCloud'
          this.serviceTagId.set(nextServiceTagId)
          this.initializeSeoProperties()
          this.isLoading.set(true)
          this.tableData.set(undefined)
          return this.http
            .get<IpAddressPrefix>(
              `https://www.azurespeed.com/api/serviceTags/${nextServiceTagId}/ipAddressPrefixes`
            )
            .pipe(
              catchError((error) => {
                console.error('Failed to load Azure IP ranges:', error)
                return of(undefined)
              })
            )
        })
      )
      .subscribe((data) => {
        this.tableData.set(data)
        this.isLoading.set(false)
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeSeoProperties(): void {
    const currentServiceTag = this.serviceTagId()
    this.seoService.setMetaTitle(`Azure IP Ranges - ${currentServiceTag}`)
    this.seoService.setMetaDescription(
      `IP ranges for Microsoft Azure Service Tag ${currentServiceTag}.`
    )
    this.seoService.setCanonicalUrl(
      `https://www.azurespeed.com/Information/AzureIpRanges/${currentServiceTag}`
    )
  }
}
