import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { GraceService } from './grace.service';
import { GraceStyleComponent } from './grace-style.component';
import { GraceStyleService } from './grace-style.service';
import { GraceGraphModalComponent } from './grace-graph.modal.component';
import { OlMapGraceDataComponent } from './olmap.grace-data.component';
import { StyleChooserModalComponent } from './style-chooser.modal.component';

import { ColorPickerModule } from 'ngx-color-picker';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';

import { PlotlyViaCDNModule } from 'angular-plotly.js';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PlotlyViaCDNModule,
    ModalModule.forChild(),
    BrowserAnimationsModule,
    BsDropdownModule,

    ColorPickerModule
  ],
  declarations: [ GraceGraphModalComponent, OlMapGraceDataComponent, GraceStyleComponent, StyleChooserModalComponent ],
  entryComponents: [ GraceGraphModalComponent, OlMapGraceDataComponent, GraceStyleComponent, StyleChooserModalComponent ],
  providers: [ GraceService, GraceStyleService ]
})
export class GraceModule { }
