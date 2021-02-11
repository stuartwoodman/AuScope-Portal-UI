import { Type } from '@angular/core';
import { KeywordComponentType } from '../../model/keywordcomponent/keywordcomponent.model';
import { CSWRecordModel } from 'portal-core-ui';

export class KeywordComponent {
  keyword: string;
  keywordComponentType: KeywordComponentType;
  keywordComponent: Type<any>;
  cswRecord?: CSWRecordModel;

  constructor(keyword: string, keywordComponentType: KeywordComponentType, keywordComponent: Type<any>) {
    this.keyword = keyword;
    this.keywordComponentType = keywordComponentType;
    this.keywordComponent = keywordComponent;
  }

}
