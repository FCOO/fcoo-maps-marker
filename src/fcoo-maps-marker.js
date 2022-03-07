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

        legendContent       : true,     //[]ID or STRING of IDs = The values to include in legend. Default = popupContent

        buttonList          : [],
        inclCenterButton    : false, //Adds a 'Center' button in popup and legend



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

        //Content for legend
        if (markerOptions.legendContent){
            if (markerOptions.legendContent === true)
                this.legendContent = this.popupContent;
            else
                this.legendContent = markerOptions.legendContent;
        }

        //Create list of needed datasetValues (if any)
        var datasetValueIds = {},
            datasetValueList = [];
        $.each(['popupContent', 'popupExtendedContent', 'legendContent'], function(index, contentListId){
            $.each(markerOptions[contentListId] || [], function(index, datasetValue_or_options_or_id){
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

            this.dataset = nsMap.dataset(
                //List of DatasetValue
                datasetValueList,

                //Options
                datasetOptions,

                //Data
                markerOptions
            );
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
                marker.bindPopup( this.popupOptions() );

            if (markerOptions.editable || markerOptions.draggable){
                marker.on('drag',      this._drag,      this);
                marker.on('dragstart', this._dragstart, this);
                marker.on('dragend',   this._dragend,   this);
            }

            this.dataset.setData(markerOptions);
            return marker;
        },


        /*****************************************************
        setLatLng(latLng)
        *****************************************************/
        setLatLng: function(latLng){
            this.options.layerOptions.latLng = latLng;
            this.dataset.setData({latLng: latLng});
            this.callAllLayers( 'setLatLng', arguments);
        },

        /*****************************************************
        setSize
        *****************************************************/
        setSize: function(size){
            this.options.layerOptions.size = size;
            return this.callAllLayers('setSize', [size]);
        },

        /*****************************************************
        setDirection( direction )
        *****************************************************/
        setDirection: function( direction ){
            this.options.layerOptions.direction = (direction || 0) % 360;
            this.dataset.setData({direction: direction});
            return this.callAllLayers('setDirection', [direction]);
        },

        /*****************************************************
        setDeltaDirection( deltaDirection )
        *****************************************************/
        setDeltaDirection: function( deltaDirection = 0 ){
            return this.setDirection( this.options.layerOptions.direction + deltaDirection );
        },

        /*****************************************************
        setCenter(map)
        *****************************************************/
        setCenter: function(map){
            map.setView(this.options.layerOptions.latLng, map.getZoom(), map._mapSync_NO_ANIMATION);
        },
        _button_onClick_setCenter: function(id, selected, $button, map){
            this.setCenter(map);
        },


        /*****************************************************
        updateMarker
        Update the marker regarding all options except size
        *****************************************************/
        updateMarker: function(options = {}, forceColor){
            this.options.layerOptions = $.extend(true, this.options.layerOptions, options);
            return this.callAllLayers('updateIcon', [this.options.layerOptions, forceColor]);
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
                    buttons             : markerOptions.buttonList
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
        _createPopupContent: function( $container ){
            this.dataset.createContent( $container, {
                contentFor: 'popupContent',
                small     : true,
                compact   : true,
            });
        },

        _createPopupExtendedContent: function( $container ){
            this.dataset.createContent( $container, {
                contentFor: 'popupExtendedContent',
                small     : true
            });
        },

        _createLegendContent: function( $container ){
            this.dataset.createContent( $container, {
                contentFor: 'legendContent'
            });
        },

        _sort_in_dataset: function(list, options, dataset){
            var sortByList; //= the sorted list of ids used for the creation

            switch (options.contentFor){
                case 'popupContent'        :  sortByList = this.popupContent;         break;
                case 'popupExtendedContent':  sortByList = this.popupExtendedContent; break;
                case 'legendContent'       :  sortByList = this.legendContent;        break;
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
        }


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



