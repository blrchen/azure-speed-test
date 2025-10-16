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
import { CommonModule, isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { API_ENDPOINT } from '../../../shared/constants'
import { SeoService } from '../../../services'
import { HeroIconComponent } from '../../../shared/icons/hero-icons.imports'

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
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeroIconComponent],
  templateUrl: './ip-lookup.component.html',
  styleUrls: ['./ip-lookup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IPLookupComponent implements OnInit {
  readonly isLoading = signal(false)
  readonly currentSearchTerm = signal('')
  readonly shareableUrl = signal('')
  readonly result = signal<IpAddress[] | null>(null)
  readonly errorMessage = signal<string | null>(null)
  readonly copyStatus = signal<'idle' | 'copied' | 'failed'>('idle')
  readonly isCopyIdle = computed(() => this.copyStatus() === 'idle')
  readonly isCopySuccess = computed(() => this.copyStatus() === 'copied')
  readonly isCopyError = computed(() => this.copyStatus() === 'failed')
  readonly hasResult = computed(() => (this.result() ?? []).length > 0)

  private copyResetTimeoutId: ReturnType<typeof setTimeout> | null = null
  private isComponentDestroyed = false
  private formBuilder = inject(FormBuilder)
  private seoService = inject(SeoService)
  private http = inject(HttpClient)
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private destroyRef = inject(DestroyRef)
  private platformId = inject(PLATFORM_ID)
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
    this.initializeSeoProperties()
    this.destroyRef.onDestroy(() => {
      this.isComponentDestroyed = true
      this.clearCopyStatusReset()
    })

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

  private initializeSeoProperties(): void {
    this.seoService.setMetaTitle('Azure IP Lookup')
    this.seoService.setMetaDescription(
      'Search for service tag and region information using an IP address or domain name.'
    )
    this.seoService.setCanonicalUrl('https://www.azurespeed.com/Azure/IPLookup')
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
    this.setCopyStatus('idle')
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
    this.setCopyStatus('idle')

    const url = `${API_ENDPOINT}/api/ipAddress?ipOrDomain=${encodeURIComponent(normalized)}`

    try {
      const lookupResult = await firstValueFrom(this.http.get<IpAddress[] | null>(url))

      if (!lookupResult) {
        this.errorMessage.set(`"${normalized}" is not a valid IPv4, IPv6 address, or domain name.`)
        this.result.set(null)
        this.shareableUrl.set('')
        this.setCopyStatus('idle')
        return
      }

      this.result.set(lookupResult)
      this.shareableUrl.set(lookupResult.length > 0 ? this.buildShareableUrl(normalized) : '')
    } catch (error) {
      console.error('Error:', error)
      this.errorMessage.set('Unable to look up the provided IP address or domain right now.')
      this.result.set(null)
      this.shareableUrl.set('')
      this.setCopyStatus('idle')
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

  async copyShareableUrl(): Promise<void> {
    const url = this.shareableUrl()
    if (!url) {
      return
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }

      await navigator.clipboard.writeText(url)
      this.setCopyStatus('copied')
    } catch (error) {
      console.error('Failed to copy shareable link', error)
      this.setCopyStatus('failed')
      this.focusShareInput()
    }
  }

  private setCopyStatus(status: 'idle' | 'copied' | 'failed'): void {
    this.copyStatus.set(status)
    this.clearCopyStatusReset()
    if (status === 'idle') {
      return
    }
    this.copyResetTimeoutId = setTimeout(() => {
      this.copyResetTimeoutId = null
      if (this.isComponentDestroyed) {
        return
      }
      this.copyStatus.set('idle')
    }, 3000)
  }

  private clearCopyStatusReset(): void {
    if (this.copyResetTimeoutId !== null) {
      clearTimeout(this.copyResetTimeoutId)
      this.copyResetTimeoutId = null
    }
  }

  private focusShareInput(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return
    }
    const shareInput = document.getElementById('shareLink')
    if (shareInput instanceof HTMLInputElement) {
      shareInput.focus()
      shareInput.select()
    }
  }

  selectShareInput(event: FocusEvent): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      target.select()
    }
  }
}
