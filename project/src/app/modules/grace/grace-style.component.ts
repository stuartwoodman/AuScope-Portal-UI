import { Component } from "@angular/core";
import { GraceStyleSettings } from "./grace-graph.models";
import { GraceStyleService } from "./grace-style.service";
import { StyleChooserModalComponent } from "./style-chooser.modal.component";
import { KeywordComponentClass } from "../../menupanel/common/model/keywordcomponent/keywordcomponent.model";
import { OlMapService } from "portal-core-ui";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "app-grace-style",
  templateUrl: "./grace-style.component.html",
  styleUrls: ["./grace-style.component.scss"],
})
export class GraceStyleComponent extends KeywordComponentClass {
  private graceStyleSettings: GraceStyleSettings;
  public modalRef: BsModalRef;

  constructor(
    protected olMapService: OlMapService,
    private modalService: BsModalService
  ) {
    super(olMapService);
  }

  /**
   * Set the WMS style for the layer
   */
  changeGraceStyle() {
    if (this.layer !== null) {
      if (
        this.graceStyleSettings === undefined ||
        this.graceStyleSettings === null
      ) {
        this.graceStyleSettings = {
          minColor: "#ff0000",
          minValue: -8,
          neutralColor: "#ffffff",
          neutralValue: 0,
          maxColor: "#0000ff",
          maxValue: 4,
          transparentNeutralColor: false,
        };
      }
      const initialState = {
        id: 1,
        graceStyleSettings: this.graceStyleSettings,
      };
      this.modalRef = this.modalService.show(StyleChooserModalComponent, {
        initialState,
      });
      this.modalRef.content.onClose.subscribe((newStyle) => {
        if (newStyle !== null) {
          this.graceStyleSettings = {
            minColor: newStyle.minColor,
            minValue: newStyle.minValue,
            neutralColor: newStyle.neutralColor,
            neutralValue: newStyle.neutralValue,
            maxColor: newStyle.maxColor,
            maxValue: newStyle.maxValue,
            transparentNeutralColor: newStyle.transparentNeutralColor,
          };
          // CSW record name must always be used as layer name
          const sld = GraceStyleService.getGraceSld(
            this.layer.name,
            "mascon_style",
            this.graceStyleSettings
          );
          this.olMapService.setLayerSourceParam(
            this.layer.id,
            "LAYERS",
            undefined);
          this.olMapService.setLayerSourceParam(this.layer.id, "SLD_BODY", sld);
        }
        this.modalRef.hide();
      });
    }
  }
}
