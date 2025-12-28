import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { firstValueFrom } from 'rxjs'

import { SeoService } from '../../../services'
import { API_ENDPOINT } from '../../../shared/constants'
import { CopyButtonComponent } from '../../../shared/copy-button/copy-button.component'
import { LucideIconComponent } from '../../../shared/icons/lucide-icons.component'

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9A-Za-z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1\d|)\d)\.){3,3}(25[0-5]|(2[0-4]|1\d|)\d)|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1\d|)\d)\.){3,3}(25[0-5]|(2[0-4]|1\d|)\d))$/
const DOMAIN_REGEX = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/i
const LOCALHOST_REGEX = /^localhost$/i

interface IpAddress {
  serviceTagId: string
  ipAddress: string
  ipAddressPrefix: string
  region: string
  systemService: string
  networkFeatures: string
}

@Component({
  selector: 'app-ip-lookup',
  imports: [ReactiveFormsModule, RouterLink, LucideIconComponent, CopyButtonComponent],
  templateUrl: './ip-lookup.component.html',
  styleUrl: './ip-lookup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IPLookupComponent implements OnInit {
  readonly isLoading = signal(false)
  readonly currentSearchTerm = signal('')
  readonly shareableUrl = signal('')
  readonly result = signal<IpAddress[] | null>(null)
  readonly errorMessage = signal<string | null>(null)
  readonly hasResult = computed(() => (this.result() ?? []).length > 0)

  private readonly formBuilder = inject(FormBuilder)
  private readonly seoService = inject(SeoService)
  private readonly http = inject(HttpClient)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly ipOrDomainValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    if (control.value === null || control.value === undefined) {
      return null
    }

    const normalized = this.normalizeInput(control.value)
    if (!normalized) {
      return null
    }

    return this.isValidIpOrDomain(normalized) ? null : { invalidIpOrDomain: true }
  }
  readonly ipLookupForm: FormGroup = this.formBuilder.group({
    ipOrDomain: ['', [Validators.required, this.ipOrDomainValidator]]
  })

  private get ipControl(): AbstractControl {
    return this.ipLookupForm.get('ipOrDomain') as AbstractControl
  }

  ngOnInit(): void {
    this.seoService.setMetaTitle('Azure IP Lookup')
    this.seoService.setMetaDescription(
      'Search for service tag and region information using an IP address or domain name.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/IPLookup')

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const control = this.ipControl

      const paramValue = params.get('ipOrDomain')
      if (!paramValue) {
        control.reset('', { emitEvent: false })
        this.clearLookupState()
        return
      }

      const normalized = this.normalizeInput(paramValue)
      if (normalized && paramValue !== normalized) {
        void this.router.navigate(['/Azure/IPLookup', normalized], { replaceUrl: true })
        return
      }

      control.setValue(normalized, { emitEvent: false })
      control.markAsPristine()
      control.markAsUntouched()
      control.updateValueAndValidity({ emitEvent: false })

      if (control.invalid) {
        control.markAsTouched({ onlySelf: true })
        this.clearLookupState()
        void this.router.navigate(['/Azure/IPLookup'], { replaceUrl: true })
        return
      }

      if (normalized === this.currentSearchTerm() && this.result()) {
        const currentResult = this.result()
        this.shareableUrl.set(
          Array.isArray(currentResult) && currentResult.length > 0
            ? this.buildShareableUrl(normalized)
            : ''
        )
        return
      }

      void this.performLookup(normalized)
    })
  }

  async submitForm(): Promise<void> {
    const control = this.ipControl

    const normalized = this.normalizeInput(control.value)
    control.setValue(normalized, { emitEvent: false })
    control.updateValueAndValidity()

    if (this.ipLookupForm.invalid) {
      this.ipLookupForm.markAllAsTouched()
      return
    }

    const currentParam = this.route.snapshot.paramMap.get('ipOrDomain')
    if (currentParam === normalized) {
      await this.performLookup(normalized)
      return
    }

    await this.router.navigate(['/Azure/IPLookup', normalized])
  }

  private clearLookupState(): void {
    this.currentSearchTerm.set('')
    this.result.set(null)
    this.isLoading.set(false)
    this.errorMessage.set(null)
    this.shareableUrl.set('')
  }

  private normalizeInput(value: unknown): string {
    if (typeof value !== 'string') {
      return ''
    }

    const trimmed = value.trim()
    if (!trimmed) {
      return ''
    }

    if (this.looksLikeDomain(trimmed)) {
      const lower = trimmed.toLowerCase()
      return lower.endsWith('.') ? lower.slice(0, -1) : lower
    }

    if (trimmed.includes(':')) {
      return trimmed.toLowerCase()
    }

    return trimmed
  }

  private isValidIpOrDomain(value: string): boolean {
    if (!value) {
      return false
    }

    if (IPV4_REGEX.test(value)) {
      return true
    }

    if (IPV6_REGEX.test(value)) {
      return true
    }

    return this.looksLikeDomain(value)
  }

  private looksLikeDomain(value: string): boolean {
    const candidate = value.endsWith('.') ? value.slice(0, -1) : value
    if (!candidate) {
      return false
    }

    return DOMAIN_REGEX.test(candidate) || LOCALHOST_REGEX.test(candidate)
  }

  private async performLookup(ipOrDomain: string): Promise<void> {
    const normalized = this.normalizeInput(ipOrDomain)
    const control = this.ipControl

    if (!normalized) {
      control.setErrors({ required: true })
      control.markAsTouched()
      this.clearLookupState()
      return
    }

    if (!this.isValidIpOrDomain(normalized)) {
      control.setErrors({ invalidIpOrDomain: true })
      control.markAsTouched()
      this.clearLookupState()
      return
    }

    this.result.set(null)
    this.isLoading.set(true)
    this.currentSearchTerm.set(normalized)
    this.errorMessage.set(null)
    this.shareableUrl.set('')

    const url = `${API_ENDPOINT}/api/ipAddress?ipOrDomain=${encodeURIComponent(normalized)}`

    try {
      const lookupResult = await firstValueFrom(this.http.get<IpAddress[] | null>(url))

      if (!lookupResult) {
        this.errorMessage.set(`"${normalized}" is not a valid IPv4, IPv6 address, or domain name.`)
        this.result.set(null)
        this.shareableUrl.set('')
        return
      }

      this.result.set(lookupResult)
      this.shareableUrl.set(lookupResult.length > 0 ? this.buildShareableUrl(normalized) : '')
    } catch {
      this.errorMessage.set('Unable to look up the provided IP address or domain right now.')
      this.result.set(null)
      this.shareableUrl.set('')
    } finally {
      this.isLoading.set(false)
    }
  }

  private buildShareableUrl(value: string | null): string {
    if (!isPlatformBrowser(this.platformId) || !value) {
      return ''
    }

    const { origin } = window.location
    return `${origin}/Azure/IPLookup/${encodeURIComponent(value)}`
  }
}
