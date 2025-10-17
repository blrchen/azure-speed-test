import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  HERO_ICON_DATA,
  HeroIconCircle,
  HeroIconDefinition,
  HeroIconElement
} from './hero-icon-data'

export type HeroIconName = keyof typeof HERO_ICON_DATA

@Component({
  selector: 'app-hero-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    @let icon = definition();
    <svg
      class="app-hero-icon__svg"
      [attr.viewBox]="icon.viewBox"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      @for (element of icon.elements; track $index) {
        @if (isCircle(element)) {
          <circle
            [attr.cx]="element.cx"
            [attr.cy]="element.cy"
            [attr.r]="element.r"
            [attr.stroke-width]="element.strokeWidth ?? defaultStrokeWidth"
          />
        } @else {
          <path
            [attr.d]="element.d"
            [attr.fill-rule]="element.fillRule"
            [attr.clip-rule]="element.clipRule"
            [attr.stroke-linecap]="element.strokeLinecap ?? 'round'"
            [attr.stroke-linejoin]="element.strokeLinejoin ?? 'round'"
            [attr.stroke-width]="element.strokeWidth ?? defaultStrokeWidth"
          />
        }
      }
    </svg>
  `,
  styles: [
    ':host { display: inline-block; line-height: 0; }',
    '.app-hero-icon__svg { width: 100%; height: 100%; display: block; }'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroIconComponent {
  readonly name = input.required<HeroIconName>()
  readonly defaultStrokeWidth = '1.5' as const

  readonly definition = computed<HeroIconDefinition>(() => {
    const icon = HERO_ICON_DATA[this.name()]
    if (!icon) {
      throw new Error(`Unknown hero icon: ${this.name()}`)
    }
    return icon
  })

  isCircle(element: HeroIconElement): element is HeroIconCircle {
    return (element as HeroIconCircle).type === 'circle'
  }
}

