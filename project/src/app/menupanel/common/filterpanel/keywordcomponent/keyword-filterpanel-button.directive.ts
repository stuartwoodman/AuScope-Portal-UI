import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[keywordFilterPanelButton]',
})
export class LayerButtonDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
