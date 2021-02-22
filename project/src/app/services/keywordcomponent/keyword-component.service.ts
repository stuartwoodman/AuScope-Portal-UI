import { ComponentFactoryResolver, ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { KeywordComponent } from '../../menupanel/common/filterpanel/keywordcomponent/keyword.component';
import { LayerModel } from 'portal-core-ui';
import { keywordComponents } from '../../../environments/keyword-components';


@Injectable({ providedIn: "root" })
export class KeywordComponentService {

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  /**
   * Construct a keyword list from a layer's keywords and CSW record keywords, removing duplicates
   *
   * @param layer the layer to inspect for keywords
   */
  private buildKeywordList(layer: LayerModel): string[] {
    let keywordList: string[] = [];
    // Check layer record for keywords if field is present
    if (layer.hasOwnProperty('keywords') && layer.keywords.length > 0) {
      keywordList = layer.keywords;
    }
    // Check CSW records (if any) for keywords
    if (layer.cswRecords.length > 0) {
      for (const cswRecord of layer.cswRecords) {
        for (const keyword of cswRecord.descriptiveKeywords) {
          if (!(keyword in keywordList)) {
            keywordList.push(keyword);
          }
        }
      }
    }
    return keywordList;
  }

  /**
   * Add any KeywordComponent filter buttons if the layer or its corresponding
   * CSW recorsd contain predefined keywords
   *
   * @param layer the layer to inspect for keywords
   * @param filterButtonsViewContainerRef the ViewContainerRef for the filter
   *          panel the component will be added to
   */
  public addFilterButtonKeywordComponents(layer: LayerModel, filterButtonsViewContainerRef: ViewContainerRef) {
    if (keywordComponents.hasOwnProperty("keywordComponents")) {
      const keywordList: string[] = this.buildKeywordList(layer);
      for (const keyword of keywordList) {
        const componentsForKeyword: KeywordComponent[] = keywordComponents["keywordComponents"].filter((c) => c.keyword === keyword);
        for (const keywordComponentItem of componentsForKeyword) {
          const componentFactory = this.componentFactoryResolver.resolveComponentFactory(keywordComponentItem.keywordComponent);
          const componentRef: ComponentRef<any> = filterButtonsViewContainerRef.createComponent<KeywordComponent>(componentFactory);
          componentRef.instance.layer = layer;
        }

      }
    }
  }

}
