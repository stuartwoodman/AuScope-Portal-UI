import { KeywordComponentType } from "app/menupanel/common/model/keywordcomponent/keywordcomponent.model";
import { GraceStyleComponent } from 'app/modules/grace/grace-style.component'
import { OlMapGraceDataComponent } from 'app/modules/grace/olmap.grace-data.component'

export const keywordComponents = {
    keywordComponents: [
        //{ keyword: 'vgl:keyword1', keywordComponent: OlMapKeyword1Component, keywordComponentType: KeywordComponentType.MapWidget },
        //{ keyword: 'vgl:keyword2', keywordComponent: OlMapKeyword2Component, keywordComponentType: KeywordComponentType.MapWidget },
        //{ keyword: 'grace', keywordComponent: OlMapGraceDataComponent, keywordComponentType: KeywordComponentType.MapWidget },
        { keyword: 'grace', keywordComponent: GraceStyleComponent, keywordComponentType: KeywordComponentType.FilterButton },
        { keyword: 'grace', keywordComponent: OlMapGraceDataComponent, keywordComponentType: KeywordComponentType.FilterButton },
    ]
}
