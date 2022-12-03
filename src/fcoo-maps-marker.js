/****************************************************************************
    fcoo-maps-marker.js,

    (c) 2021, FCOO

    https://github.com/FCOO/fcoo-maps-marker
    https://github.com/FCOO

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsColor = ns.color = ns.color || {},
        nsMap = ns.map = ns.map || {};

    nsMap.defaultMarkerOptions = {
        name        : '',
        type        : 'circle',
        constructor : L.BsMarkerCircle,

        size            : 'nl',  //Size of the marker. Possble values: 'extrasmall'/'sx', 'small'/'sm', '', 'large'/'lg', 'xlarge'*'xl'

        colorName       : nsColor.colorList[0].id,   //Name of inside fill-color of the marker
        borderColorName : 'black',                   //Name of border/line-color of the marker
        iconColorName   : 'black',                   //Name of color of the inner icon or text

        transparent     : false,    //true to make the marker semi-transparent
        hover           : true,     //true to show shadow and 0.9 opacuity for lbm-transparent when hover
        shadow          : false,    //true to add a shadow to the marker
        puls            : false,    //true to have a pulsart icon
        thickBorder     : false,    //true to have thicker border
        thinBorder      : true,     //true to have a thin border
        noBorder        : false,    //true to have no border


        /*
        Content of popup, popup-extended and legend are given by
        options.popupContent, options.popupupExtendedContent, options.legendContent = BOOLEAN or STRING or []ID with order and ids of DatasetValue-ids for options.
        */
        popupContent        : 'latLng', //[]ID or STRING of IDs = The dataset-values to include in popup
        popupWidth          : 120,

        popupExtendedContent: false,    //false, true (same as popupContent) or []ID or STRING of IDs = The dataset-values to include in legend.
        extendedPopupWidth  : 200,

        popupMinimizedContent: false,    //false, true (same as popupContent) or []ID or STRING of IDs = The dataset-values to include in legend.
        minimizedPopupWidth  : null,    //null = same as popupWidth

        legendContent       : true,     //[]ID or STRING of IDs = The values to include in legend. Default = popupContent

        buttonList          : [],
        inclCenterButton    : false, //Adds a 'Center' button in popup and legend
        inclShowButton      : true, //If true and popupMinimizedContent => Add "Show"-button that open, minimizes and pinned a popup

        contextmenu         : false, //or true or []content-item. If true: just add the buttons in butonList (if any)

        latLng          : null,
        accuracy        : null,
        speed           : null,
        direction       : null,
        altitude        : null,
        altitudeAccuracy: null,
        orientation     : null

    };

  //markerTypeList = []
    //var markerTypeList = [
    //];


        function get_datasetValue_id(datasetValue_options_or_id){
            return typeof datasetValue_options_or_id == 'string' ? datasetValue_options_or_id : datasetValue_options_or_id.id;
        }


    //createMapLayer = {MAPLAYER_ID: CREATE_MAPLAYER_AND_MENU_FUNCTION} See fcoo-maps/src/map-layer_00.js for description
    nsMap.createMapLayer = nsMap.createMapLayer || {};


    /***********************************************************
    MapLayer_Marker
    ***********************************************************/
    function MapLayer_Marker(options = {}) {
        //options.layerOptions = generel options for any layer added by Map_Layer
        var markerOptions = $.extend(true, {}, nsMap.defaultMarkerOptions, options.markerOptions || options.layerOptions || {});
        options.layerOptions = markerOptions;

        options.buttonList = markerOptions.buttonList || [];


        if (markerOptions.popupMinimizedContent && markerOptions.inclShowButton)
            options.buttonList.push({
                icon   : 'far fa-message-middle',
                text   : {da: 'Vis', en: 'Show'},
                context: this,
                onClick: this.openPopupMinimized

            });


        if (markerOptions.inclCenterButton)
            options.buttonList.push({
                icon   : 'fa-crosshairs',
                text   : {da:'Centrér', en:'Center'},
                context: this,
                onClick: this._button_onClick_setCenter
            });

        //Content for popup
        this.popupContent = markerOptions.popupContent;

        //Content for extended popup
        if (markerOptions.popupExtendedContent){
            if (markerOptions.popupExtendedContent === true)
                this.popupExtendedContent = this.popupContent;
            else
                this.popupExtendedContent = markerOptions.popupExtendedContent;
        }

        //Content for minimized popup
        if (markerOptions.popupMinimizedContent){
            if (markerOptions.popupMinimizedContent === true)
                this.popupMinimizedContent = this.popupContent;
            else
                this.popupMinimizedContent = markerOptions.popupMinimizedContent;
        }


        //Content for legend
        if (markerOptions.legendContent){
            if (markerOptions.legendContent === true)
                this.legendContent = this.popupContent;
            else
                this.legendContent = markerOptions.legendContent;
        }

        //Create list of needed datasetValues (if any)
        var _this = this,
            datasetValueIds = {},
            datasetValueList = [];
        $.each(['popupContent', 'popupExtendedContent', 'popupMinimizedContent', 'legendContent'], function(index, contentListId){
            $.each(_this[contentListId] || [], function(index, datasetValue_or_options_or_id){
                var id;
                if (typeof datasetValue_or_options_or_id == 'string')
                    id = datasetValue_or_options_or_id;
                else
                    id = datasetValue_or_options_or_id.id;
                if (!datasetValueIds[id]){
                    datasetValueIds[id] = datasetValue_or_options_or_id;
                    datasetValueList.push(datasetValue_or_options_or_id);
                }
            });
        });

        //this.dataset = Dataset with metadata for the marker
        if (datasetValueList.length){
            var datasetOptions = {
                    show: this._show_in_dataset.bind(this),
                    sort: this._sort_in_dataset.bind(this),
                };
            if (markerOptions.datasetShowWhenNull)
                datasetOptions.showWhenNull = markerOptions.datasetShowWhenNull.bind(this);


            options.dataset = {
                valueList: datasetValueList, //List of DatasetValue
                options  : datasetOptions,   //Options
                data     : markerOptions     //Data
            };

        }

        markerOptions = L.BsMarkerBase.prototype._adjustOptions( markerOptions );

        options.constructor = markerOptions.constructor;
        delete markerOptions.constructor;

        /* DEVELOPMENT
        var _this = this;
        options.buttonList = [
            {text:'dir + 10', onClick: function(){ _this.setDeltaDirection(10); } },
            {text:'Set size sm', onClick: function(){ _this.setSize('sm'); } },
            {text:'Set size nl', onClick: function(){ _this.setSize('nl'); } },
            {text:'Set size lg', onClick: function(){ _this.setSize('lg'); } },
        ];
        //*/


        nsMap.MapLayer.call(this, options);

        if (markerOptions.legendContent){
            var legendOptions = this.options.legendOptions = this.options.legendOptions || {};

            legendOptions.content = this._createLegendContent;
            legendOptions.contentContext = this;
            legendOptions.noVerticalPadding = true;
            legendOptions.noHorizontalPadding = true;
        }
        this.options.icon = this.options.icon || this.asIcon();

    }


    nsMap.MapLayer_Marker = MapLayer_Marker;
    MapLayer_Marker.prototype = Object.create(nsMap.MapLayer.prototype);

    MapLayer_Marker.prototype = $.extend({}, nsMap.MapLayer.prototype, {

        defaultMarkerOptions: nsMap.defaultMarkerOptions,

        /*****************************************************
        createLayer
        *****************************************************/
        createLayer: function(markerOptions){
            var marker = new this.options.constructor( markerOptions.latLng, markerOptions );

            if (this.popupContent || this.buttonList.length)
                marker.bindPopup( this.popupOptions(), marker.options.popupOptions );

            if (markerOptions.editable || markerOptions.draggable){
                marker.on('drag',      this._drag,      this);
                marker.on('dragstart', this._dragstart, this);
                marker.on('dragend',   this._dragend,   this);
            }

            if (markerOptions.contextmenu) {
                //If contentmenu === true use buttonList as contentmenu-items
                var list = markerOptions.contextmenu === true ? markerOptions.buttonList : markerOptions.contextmenu;

                if (list && list.length)
                    marker.setContextmenuOptions({
                        items :list,
                        header: this.options.text,
                        excludeMapContextmenu: true, //If true the map's contxtmenu-items isn't shown
                    });
            }

            return marker;
        },


        /*****************************************************
        _update(options, callAllLayerMethod, arg, onlyIndexOrMapId)
        Updates options, dataset and markers
        onlyIndexOrMapId =
            false: All marker gets new options
            []MAPID: Only maps with mapId in onlyIndexOrMapId gets new options
            true: Full update: All maps gets ALL options from this.options.layerOptions and options
        *****************************************************/
        _update: function(options, callAllLayerMethod, arg, onlyIndexOrMapId){
            this.dataset_setData(options, onlyIndexOrMapId);

            //Update layer/marker.options
            //onlyIndexOrMapId == true => Full update
            if (onlyIndexOrMapId === true)
                options = this.options.layerOptions = $.extend(true, this.options.layerOptions, options);

            //Update layer(=marker).options and call callAllLayerMethod (if any)
            this.visitAllLayers( function(layer){ $.extend(layer.options, options); }, onlyIndexOrMapId );

            if (callAllLayerMethod)
                this.callAllLayers( callAllLayerMethod, arg, onlyIndexOrMapId );

            return this;
        },

        /*****************************************************
        setDataset(latLng)
        *****************************************************/
        setDataset: function(options, callAllLayerMethod, arg, onlyIndexOrMapId){
            return this._update(options, callAllLayerMethod, arg, onlyIndexOrMapId);
        },

        /*****************************************************
        setLatLng(latLng)
        *****************************************************/
        setLatLng: function(latLng, onlyIndexOrMapId){
            return this._update({latLng: latLng}, 'setLatLng', [latLng], onlyIndexOrMapId);
        },

        /*****************************************************
        setSize
        *****************************************************/
        setSize: function(size, onlyIndexOrMapId){
            return this._update({size: size}, 'setSize', [size], onlyIndexOrMapId);
        },

        /*****************************************************
        setDirection( direction )
        *****************************************************/
        setDirection: function( direction = 0, onlyIndexOrMapId ){
            direction = (direction || 0) % 360;
            return this._update({direction: direction}, 'setDirection', [direction], onlyIndexOrMapId);
        },

        /*****************************************************
        setDeltaDirection( deltaDirection )
        *****************************************************/
        setDeltaDirection: function( deltaDirection = 0, onlyIndexOrMapId ){
            return this.visitAllLayers(function(layer){ layer.setDirection(deltaDirection, true); }, onlyIndexOrMapId);
        },

        /*****************************************************
        updateMarker
        Update the marker regarding all options except size
        *****************************************************/
        updateMarker: function(options = {}, onlyIndexOrMapId){
            return this._update(options, 'updateIcon', [options], onlyIndexOrMapId);
        },

        /*****************************************************
        setCenter(map)
        *****************************************************/
        setCenter: function(map){
            return map.setView(this.info[map.fcooMapIndex].layer.options.latLng, map.getZoom(), map._mapSync_NO_ANIMATION);
        },

        _button_onClick_setCenter: function(id, selected, $button, map){
            this.setCenter(map);
        },

        _drag: function(e){
            this.setLatLng(e.latlng);
        },

        //_dragstart: Set all popup.options.autoPan = false to allow popup to drag along
        _dragstart: function(/*e*/){
            this.visitAllLayers( function( marker ){
                var popup = marker._popup;
                if (popup){
                    popup.options._save_autoPan = popup.options.autoPan;
                    popup.options.autoPan = false;
                }
            });

        },

        //_dragend: Reset popup.options.autoPan
        _dragend: function(/*e*/){
            this.visitAllLayers( function( marker ){
                var popup = marker._popup;
                if (popup)
                    popup.options.autoPan = popup.options._save_autoPan;
            });
        },


        /*****************************************************
        asIcon()
        Return a json-record to be used as icon-options in any
        jquery-bootstrap content-options (eq. as header)
        *****************************************************/
        asIcon: function(){
            var markerOptions = this.options.layerOptions;
            return L.bsMarkerAsIcon(markerOptions.colorName, markerOptions.borderColorName, markerOptions.faClassName);
        },

        /*****************************************************
        popupOptions
        Returns the options for the markers popup
        *****************************************************/
        popupOptions: function(){
            var markerOptions = this.options.layerOptions,
                result = {
                    header: {
                        icon: this.asIcon(),
                        text: markerOptions.name || this.options.text,
                    },
                    fixable             : true,
                    width               : markerOptions.popupWidth,
                    //noVerticalPadding   : false,
                    //noHorizontalPadding : true,
                    scroll              : false,
                    content             : this._createPopupContent,
                    contentContext      : this,
                    verticalButtons     : true,
                    buttons             : markerOptions.buttonList,
                };


            if (this.popupMinimizedContent)
                result.minimized = {
                    width               : markerOptions.minimizedPopupWidth || markerOptions.popupWidth,
                    //noVerticalPadding   : false,
                    //noHorizontalPadding : true,
                    scroll              : false,
                    content             : this._createPopupMinimizedContent,
                    contentContext      : this,
                    verticalButtons     : false
                };

            if (this.popupExtendedContent)
                result.extended = {
                    width               : markerOptions.extendedPopupWidth,
                    //noVerticalPadding   : false,
                    //noHorizontalPadding : true,
                    scroll              : false,
                    content             : this._createPopupExtendedContent,
                    contentContext      : this,
                    verticalButtons     : false
                };
            return result;
        },


        /*****************************************************
        _createPopupContent
        _createPopupExtendedContent
        _createLegendContent
        _sort_in_dataset
        _show_in_dataset
        *****************************************************/
        _createPopupContent: function( $container, popup, map ){
            this.getDataset(map).createContent( $container, {
                contentFor: 'popupContent',
                small     : true,
                compact   : true,
            });
        },

        _createPopupExtendedContent: function( $container, popup, map ){
            this.getDataset(map).createContent( $container, {
                contentFor: 'popupExtendedContent',
                small     : true
            });
        },

        _createPopupMinimizedContent: function( $container, popup, map ){
            this.getDataset(map).createContent( $container, {
                contentFor: 'popupMinimizedContent',
                small     : true,
                compact   : true,
                noLinks   : true
            });
        },

        _createLegendContent: function( $container, mapLayer, map ){
            this.getDataset(map).createContent( $container, {
                contentFor: 'legendContent'
            });
        },

        _sort_in_dataset: function(list, options, dataset){
            var sortByList; //= the sorted list of ids used for the creation

            switch (options.contentFor){
                case 'popupContent'         :  sortByList = this.popupContent;          break;
                case 'popupMinimizedContent':  sortByList = this.popupMinimizedContent; break;
                case 'popupExtendedContent' :  sortByList = this.popupExtendedContent;  break;
                case 'legendContent'        :  sortByList = this.legendContent;         break;
            }
            if (!sortByList) return;

            //Reset the temporary sortByValue
            $.each(dataset.datasetValues, function(id, datasetValue){
                datasetValue.__sortByValue = 9999;
            });

            //Set the current sortByValue
            $.each(sortByList, function(index, datasetValue_options_or_id){
                dataset.datasetValues[ get_datasetValue_id(datasetValue_options_or_id) ].__sortByValue = index;
            });

            list.sort( function(datasetValueA, datasetValueB){ return datasetValueA.__sortByValue - datasetValueB.__sortByValue; });

            return list;
        },

        _show_in_dataset: function(id, options){
            var result = false,
                contentList = this[options.contentFor] || [];
            $.each(contentList, function(index, datasetValue_options_or_id){
                result = result || (get_datasetValue_id(datasetValue_options_or_id) == id);
            });
            return result;
        },


        openPopupMinimized: function( id, selected, $button, map){
            var mapIndex = nsMap.getMap(map).fcooMapIndex,
                info     = this.info[mapIndex],
                marker   = info ? info.layer : null,
                popup    = marker ? marker._popup : null;

            if (!popup)
                return;
            marker.openPopup();
            popup._setPinned(true);
            popup.setSizeMinimized();
        },

    });



    /***********************************************************
    Add MapLayer_Marker to createMapLayer
    MANGLER: Skal nok ikke bruges. I stedet skal der være grupper af marker
    ***********************************************************/
/*
    nsMap.createMapLayer["MARKER"] = function(options, addMenu){

        //adjust default options with options into mapLayerOptions

        var mapLayer = nsMap._addMapLayer(id, nsMap.MapLayer_Marker, mapLayerOptions )

        addMenu( mapLayer.menuItemOptions() ); //OR list of menu-items
    };
*/

}(jQuery, L, this, document));



