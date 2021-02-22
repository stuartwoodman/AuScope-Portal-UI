import { Type } from '@angular/core';
import { LayerModel } from 'portal-core-ui';

export class KeywordComponent {
  keyword: string;
  keywordComponent: Type<any>;
  layer?: LayerModel;

  constructor(keyword: string, keywordComponent: Type<any>) {
    this.keyword = keyword;
    this.keywordComponent = keywordComponent;
  }

}
