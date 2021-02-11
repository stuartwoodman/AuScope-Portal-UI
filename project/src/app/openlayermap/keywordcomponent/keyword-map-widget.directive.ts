import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[keywordMapWidget]',
})
export class KeywordMapWidgetDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
