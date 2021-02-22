import { Component, AfterViewInit } from '@angular/core';
import { KeywordComponentClass } from 'app/menupanel/common/model/keywordcomponent/keywordcomponent.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import * as Proj from 'ol/proj';
import { OlMapObject, OlMapService } from 'portal-core-ui';
import { GraceGraphModalComponent } from './grace-graph.modal.component';


@Component({
    selector: 'app-ol-map-grace-data',
    templateUrl: './olmap.grace-data.component.html',
    styleUrls: ['./olmap.grace-data.component.scss']
})

export class OlMapGraceDataComponent extends KeywordComponentClass implements AfterViewInit {

    buttonText = 'GRACE';
    public modalRef: BsModalRef;

    constructor(public olMapObject: OlMapObject, protected olMapService: OlMapService, private modalService: BsModalService) {
        super(olMapService);
    }

    ngAfterViewInit() {
        // register click handler
        this.olMapObject.registerClickHandler(this.handleClick.bind(this));
    }

    public selectGraceData() {
        this.buttonText = 'Click on Mascon';
    }

    public handleClick(p: [number, number]) {
        if (this.buttonText === 'Click on Mascon') {
            const map = this.olMapObject.getMap();
            const clickCoord = map.getCoordinateFromPixel(p);
            const lonlat = Proj.transform(clickCoord, 'EPSG:3857', 'EPSG:4326');

            const initialState = {
                id: 1,
                x: lonlat[0],
                y: lonlat[1]
            }
            this.modalRef = this.modalService.show(GraceGraphModalComponent, { initialState });
            this.modalRef.content.onClose.subscribe(result => {
                this.modalRef.hide();
            });
            this.buttonText = 'GRACE';
        }
    }

}
