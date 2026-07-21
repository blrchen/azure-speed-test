import { Directive, input } from '@angular/core'

@Directive({
  selector: '[appWidthPercent]',
  host: {
    '[style.width.%]': 'appWidthPercent()',
  },
})
export class WidthPercentDirective {
  readonly appWidthPercent = input<number>(0)
}
