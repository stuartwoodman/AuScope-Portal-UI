import { CsMapService, CsWMSService, CSWRecordModel, LayerModel, OnlineResourceModel, UtilitiesService } from '@auscope/portal-core-ui';
import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ViewerConfiguration } from '@auscope/angular-cesium';
import { CsMapComponent } from 'app/cesium-map/csmap.component';
import { Cartesian3, Color, ColorMaterialProperty, ImageryLayer, MapMode2D, PolygonHierarchy, Rectangle, Resource, Viewer, WebMapServiceImageryProvider } from 'cesium';
import { DeviceDetectorService } from 'ngx-device-detector';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import intersect from '@turf/intersect';
import * as when from 'when';
import { environment } from '../../../../../environments/environment';
import { FilterService, LayerTimes } from 'app/services/filter/filter.service';


@Component({
    selector: 'app-cesium-preview-map',
    template: `
    <ac-map>
        <div id="previewMapElement" #previewMapElement></div>
    </ac-map>
    `,
    providers: [ViewerConfiguration]
})
export class CesiumMapPreviewComponent implements AfterViewInit {

    @Input() layer: LayerModel;

    @ViewChild('previewMapElement', { static: true }) mapElement: ElementRef;
    viewer: Viewer;

    BBOX_HIGHLIGHT_COLOUR = new ColorMaterialProperty(Color.YELLOW.withAlpha(0.25));
    BBOX_STANDARD_COLOUR = new ColorMaterialProperty(Color.BLUE.withAlpha(0.25));

    // 114.591, -45.837, 148.97, -5.73
    AUS_POLYGON = new PolygonHierarchy(Cartesian3.fromDegreesArray([
        114.591, -45.837, 148.97, -45.837, 148.97, -5.73, 114.591, -5.73, 114.591, -45.837
    ]));

    // Keep track of overall bounding box
    minWest: number;
    maxEast: number;
    minSouth: number;
    maxNorth: number;

    layerTimes: LayerTimes;

    /**
     * This constructor creates the preview map
     **/
    constructor(private csMapService: CsMapService, private wmsService: CsWMSService, private filterService: FilterService,
        private viewerConf: ViewerConfiguration, private deviceService: DeviceDetectorService) {
        // viewerOptions will be passed the Cesium.Viewer constuctor
        this.viewerConf.viewerOptions = {
            selectionIndicator: false,
            timeline: false,
            infoBox: false,
            fullscreenButton: false,
            baseLayerPicker: true,
            imageryProviderViewModels: this.csMapService.createBaseMapLayers(),
            terrainProviderViewModels: [],
            animation: false,
            shouldAnimate: false,
            homeButton: false,
            geocoder: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            mapMode2D: MapMode2D.INFINITE_SCROLL,
        };
        // Will be called on viewer initialistion
        this.viewerConf.viewerModifier = (viewer: any) => {
            this.viewer = viewer;
            // Look at Australia
            viewer.camera.setView({
                destination: CsMapComponent.AUSTRALIA
            });
            // This reduces the blockiness of the text fonts and other graphics
            this.viewer.resolutionScale = window.devicePixelRatio;
        }
    }

    ngAfterViewInit() {
        this.filterService.getLayerTimes(this.layer.id).subscribe(layerTimes => {
            this.layerTimes = layerTimes;
        });
    }

    /**
     * Add a bbox to the map
     * @param name the name of the bbox
     * @param coords an array of lon/lat coords [west, south, east, north]
     */
    addBbox(record: CSWRecordModel, coords: number[]) {
        // Adjust overall bounding box values
        if (!this.minWest || coords[0] < this.minWest) {
            this.minWest = coords[0];
        }
        if (!this.minSouth || coords[1] < this.minSouth) {
            this.minSouth = coords[1];
        }
        if (!this.maxEast || coords[2] > this.maxEast) {
            this.maxEast = coords[2];
        }
        if (!this.maxNorth || coords[3] > this.maxNorth) {
            this.maxNorth = coords[3];
        }
        // Add polygon
        this.viewer.entities.add({
            name: record.name,
            id: record.id,
            polygon: {
                hierarchy: new PolygonHierarchy(Cartesian3.fromDegreesArray([
                    coords[0], coords[1],
                    coords[2], coords[1],
                    coords[2], coords[3],
                    coords[0], coords[3],
                    coords[0], coords[1]
                ])),
                height: 0,
                material: this.BBOX_STANDARD_COLOUR,
                outline: true,
                outlineColor: Color.BLACK
            }
        });
    }

    /**
     * Add a WMS layer to the map
     * @method addLayer
     * @param layer the WMS layer to add to the map.
     * @param param request parameters
     */
    public addLayer(layer: LayerModel, wmsOnlineResource: OnlineResourceModel, param?: any): void {
        if (!param) {
            param = {};
        }

        if (this.layerTimes.currentTime) {
            param['time'] = this.layerTimes.currentTime;
        }

        // Collate parameters for style request
        const collatedParam = UtilitiesService.collateParam(layer, wmsOnlineResource, param);
        // Set 'usePost' if style request parameters are too long
        const usePost = this.wmsService.wmsUrlTooLong(environment.portalBaseUrl + layer.proxyStyleUrl + collatedParam.toString(), layer);
        // Perform request for style data, store subscription so we can cancel if user removes layer
        this.wmsService.getSldBody(layer.proxyStyleUrl, usePost, wmsOnlineResource, collatedParam).subscribe(
        sld_body => {
            const longResp = this.wmsService.wmsUrlTooLong(sld_body, layer);
            // Create parameters for add layer request
            const params = wmsOnlineResource.version.startsWith('1.3')
                ? this.wmsService.getWMS1_3_0param(layer, wmsOnlineResource, collatedParam, longResp, sld_body)
                : this.wmsService.getWMS1_1param(layer, wmsOnlineResource, collatedParam, longResp, sld_body);

            let lonlatextent;
            if (wmsOnlineResource.geographicElements && wmsOnlineResource.geographicElements.length > 0) {
                const cswExtent = wmsOnlineResource.geographicElements[0];

                const cswExtentPoly = bboxPolygon([cswExtent.westBoundLongitude, cswExtent.southBoundLatitude,
                                                cswExtent.eastBoundLongitude, cswExtent.northBoundLatitude]);
                const globalExtentPoly = bboxPolygon([-180, -90, 180, 90]);
                const intersectionPoly = intersect(cswExtentPoly, globalExtentPoly);
                lonlatextent = bbox(intersectionPoly);
            } else {
                // if extent isnt contained in the csw record then use global extent
                // TODO: Make Aus
                lonlatextent = [-180, -90, 180, 90];
                // the current view extent cannot be used as the bounds for the layer because the user could zoom out
                // after adding the layer to the map.
            }

            this.addCesiumLayer(wmsOnlineResource, params, longResp, lonlatextent);
        });
    }

    /**
     * Calls CesiumJS to add WMS layer to the map
     * @method addCesiumLayer
     * @param wmsOnlineResource details of WMS service
     * @param usePost whether to use a POST request
     * @param lonlatextent longitude latitude extent of the layer as an array [west,south,east,north]
     * @returns the new CesiumJS ImageryLayer object
     */
    private addCesiumLayer(wmsOnlineResource, params, usePost: boolean, lonlatextent): void/*ImageryLayer*/ {
        const browserInfo = this.deviceService.getDeviceInfo();
        const url = UtilitiesService.rmParamURL(wmsOnlineResource.url);
        let wmsImagProv;

        // Set up WMS service
        if (!usePost || UtilitiesService.isArcGIS(wmsOnlineResource) ) {
            // NB: ArcGisMapServerImageryProvider does not allow additional parameters for ArcGIS, i.e. no styling
            // So we use a normal GET request & WebMapServiceImageryProvider instead
            wmsImagProv = new WebMapServiceImageryProvider({
                url: url,
                layers: wmsOnlineResource.name,
                parameters: params,
                rectangle: Rectangle.fromDegrees(lonlatextent[0], lonlatextent[1], lonlatextent[2], lonlatextent[3])
            });
        } else {

            // Keep old function call
            const oldCreateImage = (Resource as any)._Implementations.createImage;

            // Overwrite CesiumJS 'createImage' function to allow us to do 'POST' requests via a proxy
            // If there is a 'usepost' parameter in the URL, then 'POST' via proxy else uses standard 'GET'
            // TODO: Implement a Resource constructor parameter instead of 'usepost'
            (Resource as any)._Implementations.createImage = function (request, crossOrigin, deferred, flipY, preferImageBitmap) {
            const jURL = new URL(request.url);
            // If there's no 'usepost' parameter then call the old 'createImage' method which uses 'GET'
            if (!jURL.searchParams.has('usepost')) {
                return oldCreateImage(request, crossOrigin, deferred, flipY, preferImageBitmap);
            }
            // Initiate loading WMS tiles via POST & a proxy
            (Resource as any).supportsImageBitmapOptions()
                .then(function (supportsImageBitmap) {
                const responseType = 'blob';
                const method = 'POST';
                const xhrDeferred = when.defer();
                // Assemble parameters into a form for 'POST' request
                const postForm = new FormData();
                postForm.append('service', 'WMS');
                jURL.searchParams.forEach(function(val, key) {
                    if (key === 'url') {
                    postForm.append('url', val.split('?')[0] + '?service=WMS');
                    const kvp = val.split('?')[1];
                    if (kvp) {
                        /*me.*/this.wmsService.paramSubst(kvp.split('=')[0], kvp.split('=')[1], postForm);
                    }
                    } else {
                        /*me.*/this.wmsService.paramSubst(key, val, postForm);
                    }
                });

                const newURL = jURL.origin + jURL.pathname;
                // Initiate request
                const xhr = (Resource as any)._Implementations.loadWithXhr(
                    newURL,
                    responseType,
                    method,
                    postForm,
                    undefined,
                    xhrDeferred,
                    undefined,
                    undefined,
                    undefined
                );

                if (xhr && xhr.abort) {
                    request.cancelFunction = function () {
                    xhr.abort();
                    };
                }
                return xhrDeferred.promise.then(function (blob) {
                    if (!blob) {
                    deferred.reject(
                        new Error('Successfully retrieved ' + url + ' but it contained no content.')
                    );
                    return;
                    }
                    // 'createImageBitmap' was not fully supported in older versions of Firefox (ESR & version <= 92.0) and Safari
                    // due to bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1367251
                    if (browserInfo.browser === 'Firefox' && parseFloat(browserInfo.browser_version) <= 92.0) {
                    return createImageBitmap(blob);
                    } else {
                    return (Resource as any).createImageBitmapFromBlob(blob, {
                        flipY: flipY,
                        premultiplyAlpha: false,
                        skipColorSpaceConversion: false
                    });
                    }
                }).then(deferred.resolve);
                }).catch(deferred.reject);
            };
            /* End of 'createImage' overwrite */

            // Create a resource which uses our custom proxy
            const res = new Resource({url: url, proxy: new MyDefaultProxy(environment.portalBaseUrl + 'getWMSMapViaProxy.do?url=')});

            // Force Resource to use 'POST' and our proxy
            params['usepost'] = true;
            wmsImagProv = new WebMapServiceImageryProvider({
                url: res,
                layers: wmsOnlineResource.name,
                parameters: params,
                rectangle: Rectangle.fromDegrees(lonlatextent[0], lonlatextent[1], lonlatextent[2], lonlatextent[3])
            });
        }
        this.viewer.imageryLayers.addImageryProvider(wmsImagProv);
    }

    /**
     * Determine the min/max bounds of the added bboxes and fit view to these
     */
    fitMap() {
        let fitPolygon = this.AUS_POLYGON;
        if (this.minWest && this.minWest !== -180 && this.maxEast && this.maxEast !== 180 &&
            this.minSouth && this.minSouth !== -90 && this.maxNorth && this.maxNorth !== 90 ) {
            fitPolygon = new PolygonHierarchy(Cartesian3.fromDegreesArray([
                this.minWest, this.minSouth,
                this.maxEast, this.minSouth,
                this.maxEast, this.maxNorth,
                this.minWest, this.maxNorth,
                this.minWest, this.minSouth
            ]));
        }
        // Can't zoomTo Entities that aren't added to map, so add invisible, zoom then delete
        this.viewer.entities.add({
            id: 'temp-bbox',
            show: false,
            polygon: {
                hierarchy: fitPolygon
            }
        });
        const bboxEntity = this.viewer.entities.getById('temp-bbox');
        this.viewer.zoomTo(bboxEntity).then(() => {
            this.viewer.entities.removeById('temp-bbox');
        });
    }

    /**
     * Highlights or unhighlights a bounding box in the preview map
     *
     * @param id the ID of the CSW record associated with the bbox
     * @param state if true will highlight bounding box, else will unhighlight it
     */
    setBBoxHighlight(id: string, state: boolean) {
        const entity = this.viewer.entities.getById(id);
        // No entity will be returned for world coverage layers as no bbox is shown
        if (entity) {
            entity.polygon.material = state ? this.BBOX_HIGHLIGHT_COLOUR : this.BBOX_STANDARD_COLOUR;
        }
    }

}


// TODO: Duplicated from CsWMSService, make common
// Substitute our own proxy class to replace Cesium's 'Proxy' class
// so that the parameters are not uuencoded
class MyDefaultProxy {
    proxy: string;
      constructor(proxy) {
    this.proxy = proxy;
    }
    getURL: (any) => any;
  }
  MyDefaultProxy.prototype.getURL = function(resource) {
    const prefix = this.proxy.indexOf('?') === -1 ? '?' : '';
    return this.proxy + prefix + resource;
  };
