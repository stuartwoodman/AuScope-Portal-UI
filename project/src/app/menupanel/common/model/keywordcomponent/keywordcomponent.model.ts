import { LayerModel, OlMapService } from 'portal-core-ui';

export abstract class KeywordComponentClass {

    public layer: LayerModel;

    constructor(protected olMapService: OlMapService) {}

    public enabled(): boolean {
        let enabled = false;
        if (this.layer !== null) {
            enabled = this.olMapService.layerExists(this.layer.id)
        }
        return enabled;
    }
}
