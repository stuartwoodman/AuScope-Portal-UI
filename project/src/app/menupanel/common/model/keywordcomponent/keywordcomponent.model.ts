import { ViewContainerRef } from '@angular/core';
import { KeywordComponent } from '../../filterpanel/keywordcomponent/keyword.component';
import { CSWRecordModel, OlMapService } from 'portal-core-ui';

export enum KeywordComponentType {
    'MapWidget',
    'FilterButton'
}

export interface AddedKeywordComponent {
    cswRecordIds: string[];
    keywordComponent: KeywordComponent;
    viewContainerRef: ViewContainerRef;
}

export abstract class KeywordComponentClass {

    public cswRecord: CSWRecordModel;

    constructor(protected olMapService: OlMapService) {}

    public getCSWRecord(): CSWRecordModel {
        return this.cswRecord;
    }

    public setCSWRecord(cswRecord: CSWRecordModel) {
        this.cswRecord = cswRecord;
    }

    public enabled(): boolean {
        let enabled = false;
        if (this.cswRecord !== null) {
            enabled = this.olMapService.layerExists(this.cswRecord.id)
        }
        return enabled;
    }
}
