/**
 * Reads values off native form-control events.
 *
 * The filter-only pages bind plain <input>/<select> elements instead of Signal Forms, since
 * they have no validation, submit lifecycle, or async checks to model - that let the whole
 * @angular/forms/signals chunk drop off those routes. These helpers cover the one thing the
 * removed FormField directive still did for them: pulling the current value out of the event.
 */

/** Current value of the <input> that raised the event, or '' if the target is not an input. */
export function readInputValue(event: Event): string {
  return event.target instanceof HTMLInputElement ? event.target.value : ''
}

/** Current value of the <select> that raised the event, or '' if the target is not a select. */
export function readSelectValue(event: Event): string {
  return event.target instanceof HTMLSelectElement ? event.target.value : ''
}
