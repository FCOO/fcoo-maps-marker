/****************************************************************************
    fcoo-maps-marker.js,

    (c) 2021, FCOO

    https://github.com/FCOO/fcoo-maps-marker
    https://github.com/FCOO

****************************************************************************/
(function ($, L, window, document, undefined) {
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
        thinBorder      : true, //false,    //true to have a thin border
        noBorder        : false,    //true to have no border



        popupContent        : 'latLng', //popupContent = []ID or STRING of IDs = The values to include in popup
        popupWidth          : 120,
        hasExtendedPopup    : true,

        popupExtendedContent: false, //false, true (same as popupContent) or []ID or STRING of IDs = The values to include in legend. Default = popupContent
        extendedPopupWidth  : 200,


        //legendContent:  = []ID or STRING of IDs = The values to include in legend. Default = popupContent

        buttonList      : [],
        inclCenterButton: true, //Adds a 'Center' button in popup and legend


        latLng          : null,
        accuracy        : null,
        speed           : null,
        direction       : null,
        altitude        : null,
        altitudeAccuracy: null,
        orientation     : null,


        velocity        : 'not null', //Dummy value to allow popup content to check if speed and direction exists



    };


    //markerTypeList = []
    //var markerTypeList = [
    //];

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


        function adjust( content ){
            var asString = $.isArray(content) ? content.join(' ') : (content || '');
            return asString.split(' ');
        }

        //popupContent = ids for content in popups
        options.popupContentIdList = adjust( markerOptions.popupContent );
        options.popupContentIdAsStr = options.popupContentIdList.join(' ');

        if (markerOptions.popupExtendedContent){
            if (markerOptions.popupExtendedContent === true){
                options.popupExtendedContentIdList = options.popupContentIdList;
                options.popupExtendedContentIdAsStr = options.popupContentIdAsStr;
            }
            else {
                options.popupExtendedContentIdList = adjust( markerOptions.popupExtendedContent );
                options.popupExtendedContentIdAsStr = options.popupExtendedContentIdList.join(' ');
            }
        }

        //legendContent = ids for content in legend. Default = popupContent
        markerOptions.legendContent = markerOptions.hasOwnProperty('legendContent') ? markerOptions.legendContent || '' : markerOptions.popupContent;
        options.legendContentIdList = adjust( markerOptions.legendContent );
        options.legendContentIdAsStr = options.legendContentIdList.join(' ');


        markerOptions = L.BsMarkerBase.prototype._adjustOptions( markerOptions );


        options.onAdd = $.proxy(this._onAdd, this);

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


        //options.layerOptions = markerOptions;

        nsMap.MapLayer.call(this, options);

        if (markerOptions.legendContent){
            var legendOptions = this.options.legendOptions = this.options.legendOptions || {};
            legendOptions.content = this._getLegendContent();
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

            if (this.options.popupContentIdAsStr || this.options.buttonList.length)
                marker.bindPopup( this.popupOptions() );

            if (markerOptions.editable || markerOptions.draggable){
                marker.on('drag', this._drag, this);
                marker.on('dragstart', this._dragstart, this);
                marker.on('dragend', this._dragend, this);
            }

            return marker;
        },


        /*****************************************************
        _onAdd
        *****************************************************/
        _onAdd: function(map){
            if (this.options.layerOptions.legendContent)
                this._updateLegendContent(map.fcooMapIndex);
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
        _visitAllMaps
        Call methodName for all markers in all maps
        *****************************************************/
        _visitAllMaps: function(methodName, arg, onlyContentId = ''){
            var _this    = this,
                _options = _this.options,
                updatePopupContent  = true,
                updateLegendContent = true;

            if (onlyContentId){
                updatePopupContent  = false;
                updateLegendContent = false;

                $.each(onlyContentId.split(' '), function(index, id){
                    updatePopupContent  = updatePopupContent  || _options.popupContentIdAsStr.includes(id) || _options.popupExtendedContentIdAsStr.includes(id);
                    updateLegendContent = updateLegendContent || _options.legendContentIdAsStr.includes(id);
                });
            }

            $.each(this.info, function(mapIndex, info){
                var marker = info ? info.layer : null;
                if (marker){
                    if (marker[methodName])
                        marker[methodName].apply(marker, arg);

                    if ((_options.popupContentIdAsStr || _options.popupExtendedContentIdAsStr) && marker._popup && updatePopupContent)
                        marker._popup.changeContent(_this.popupOptions(), _this);
                }
                if (_options.legendContentIdAsStr && updateLegendContent)
                    _this._updateLegendContent( mapIndex );
            });
            return this;
        },

        /*****************************************************
        _updateLegendContent
        Update the legend content for map = mapIndex
        *****************************************************/
        _updateLegendContent: function(mapIndex){
            var legend = this.info[mapIndex] ? this.info[mapIndex].legend : null;
            if (legend)
                legend.updateContent( this._getLegendContent() );
            return this;
        },


        /*****************************************************
        updateMarker
        Update the marker regarding all options except size
        *****************************************************/
        updateMarker: function(options = {}, forceColor){
            this.options.layerOptions = $.extend(true, this.options.layerOptions, options);
            return this._visitAllMaps('updateIcon', [this.options.layerOptions, forceColor]);
        },

        _drag: function(e){
            this.setLatLng(e.latlng);
        },

        //_dragstart: Set all popup.options.autoPan = false to allow popup to drag along
        _dragstart: function(/*e*/){
            $.each(this.info, function(id, marker){
                var popup = marker._popup;
                if (popup){
                    popup.options._save_autoPan = popup.options.autoPan;
                    popup.options.autoPan = false;
                }
            });
        },

        //_dragend: Reset popup.options.autoPan
        _dragend: function(/*e*/){
            $.each(this.info, function(id, marker){
                var popup = marker._popup;
                if (popup)
                    popup.options.autoPan = popup.options._save_autoPan;
            });
        },


        /*****************************************************
        setLatLng(latLng)
        *****************************************************/
        setLatLng: function(latLng){
            this.options.layerOptions.latLng = latLng;
            this._visitAllMaps('setLatLng', arguments, 'latLng');
        },



        /*****************************************************
        setSize
        *****************************************************/
        setSize: function(size){
            this.options.layerOptions.size = size;
            return this._visitAllMaps('setSize', [size]);
        },


        /*****************************************************
        setDirection( direction )
        *****************************************************/
        setDirection: function( direction ){
            this.options.layerOptions.direction = (direction || 0) % 360;
            return this._visitAllMaps('setDirection', [direction], 'velocity orientation');
        },

        /*****************************************************
        setDeltaDirection( deltaDirection )
        *****************************************************/
        setDeltaDirection: function( deltaDirection = 0 ){
            return this.setDirection( this.options.layerOptions.direction + deltaDirection );
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
                    content             : this.options.popupContentIdAsStr ? this._getFullPopupContent(false, this.options.popupContentIdList) : '',
                    verticalButtons     : true,
                    buttons             : markerOptions.buttonList
                };

            if (this.options.popupExtendedContentIdAsStr)
                result.extended = {
                    width               : markerOptions.extendedPopupWidth,
                    //noVerticalPadding   : false,
                    //noHorizontalPadding : true,
                    scroll              : false,
                    content             : this._getFullPopupContent(true, this.options.popupExtendedContentIdList),
                    verticalButtons     : false
                };
            return result;
        },


        /*****************************************************
        _getLegendContent()
        Returns the content-options for the legend
        *****************************************************/
        _getLegendContent: function(){
            return this._getFullPopupContent(true, this.options.legendContentIdList);
        },


        /*****************************************************
        getPopupContent(id, value, extended)
        Returns the bsModal-content options for options-id = id
        This methods must be set for different versions of MapMarker
        *****************************************************/
        getPopupContent: function(/*id, value, extended*/){
        },

        /*****************************************************
        getStandardPopupContent(id, value, extended)
        Returns the bsModal-content options for options-id = id
        for the standard/common parts
        *****************************************************/
        getStandardPopupContent: function(id, value, extended){
            var markerOptions    = this.options.layerOptions,
                content          = null,
                displayAsUnknown = false;

            if ((value === null) || (value === undefined)){
                if (extended)
                    displayAsUnknown = true;
                else
                     return null;
            }

            switch (id ){
                case 'latLng':
                    var latLng = markerOptions.latLng;
                    content = {
                        type     : extended ? 'text' : 'textbox',
                        label    : {icon: 'fa-location-pin', text: {da:'Position', en:'Position'}},
                        vfFormat : 'latlng',
                        vfOptions: extended ? {} : {separator: '<br>'},
                        onClick  : $.proxy(value.asModal, latLng),
                    };
                    break;

                case 'accuracy':
                    if (extended){
                        var acc = Math.round(markerOptions.accuracy || 0)+'m';
                        content = {
                            label: {icon: 'fa-plus-minus', text: {da: 'Nøjagtighed', en:'Accuracy'}},
//                            text : [{da:'Nøjagtigheden er ca. '+acc, en:'The accuracy is approx. '+acc}, ],
/*or*/                        text : {da:'Ca. '+acc, en:'Approx. '+acc},

//MANGLER                            onClick: function(){ alert('Skal vise en cirkel med nøjagtigheden'); }
                        };
                    }
                    break;

                case 'altitude':
                    content = {
                        label   : {icon: 'fa-arrow-to-top', text: {da:'Højde', en:'Altitude'} },
                        vfFormat: 'height'
                    };
                    if (extended && markerOptions.altitudeAccuracy)
                        $.extend(content, {
                            vfFormat : ['height', 'height'],
                            vfValue  : [value, Math.abs(markerOptions.altitudeAccuracy)],
                            vfOptions: [{}, {prefix:' &plusmn; '}]
                        });
                    break;


                case 'speed':
                    content = {
                        label   : {icon: 'fa-tachometer', text: {da:'Fart', en:'Speed'} },
                        vfFormat: 'speed'
                    };
                    break;

                case 'velocity':
                    if (markerOptions.speed === null)
                        return null;

                    //If no direction is present => return info on speed
                    if (markerOptions.direction === null)
                        return this.getStandardPopupContent('speed', markerOptions.speed, extended);

                    content = {
                        label  : {icon: 'fa-tachometer', text: {da:'Hastighed', en:'Velocity'} },
                        type   : 'text',
                        text   : $.proxy(extended ? this._createVelocityExtendedContent : this._createVelocityContent, this),
                        vfValue: '',
                    };


                    break;

                case 'orientation':
                    content = {
                        label   : {icon: 'fa-mobile-android', text: {da:'Orientering', en:'Orientation'}},
                        vfFormat: 'direction'
                    };
                    break;

                default: return null;
            }

            if (displayAsUnknown)
                return {
                    label    : content.label,
                    type     : 'text',
                    fullWidth: true,
                    center   : true,
                    text     : {da:'* Ukendt *', en:'* Unknown *'}
                };
            else
                return content ? $.extend({type: 'text', vfValue: value, fullWidth: true, center: true}, content) : null;
        },


        _createVelocityExtendedContent: function($container){
            return this._createVelocityContent($container, true);
        },

        _createVelocityContent: function($container, extended){
            var markerOptions = this.options.layerOptions,
                speed         = markerOptions.speed,
                direction     = markerOptions.direction;

            $container
                .addClass('d-flex justify-content-evenly flex-row')
                .css('justify-content', 'space-evenly');    //Bootstrap 4 do not support class justify-content-evenly
                //justify-content-around justify-content-evenly justify-content-between

            $container
                ._bsAddHtml({vfFormat: 'speed', vfValue: speed})
                ._bsAddHtml({icon: 'fa-up'}).find('i').css('transform', 'rotate('+ direction +'deg)');

            if (extended)
                $container
                    ._bsAddHtml({vfFormat: 'direction',      vfValue: markerOptions.direction})
                    ._bsAddHtml({vfFormat: 'direction_text', vfValue: markerOptions.direction});
        },

        /*****************************************************
        _getFullPopupContent
        Put together all the contents for noraml and extended popup
        by calling getStandardPopupContent(id, value, false/true) and
        getPopupContent(id, value, false/true), where id in the list markerOptions.info
        *****************************************************/
        _getFullPopupContent: function(extended, contentIdList){
            var _this = this,
                markerOptions = this.options.layerOptions,
                contentList = [];

            contentIdList = contentIdList || this.options.popupContentIdList;
            $.each(contentIdList, function(index, id){
                var content =
                        _this.getPopupContent( id, markerOptions[id], extended ) ||
                        _this.getStandardPopupContent( id, markerOptions[id], extended );

                if (content)
                    contentList.push( content );
            });
            return contentList;
        },




        /*Extend METHOD
        METHOD: function (METHOD) {
            return function () {

                //New extended code
                //......extra code

                //Original function/method
                METHOD.apply(this, arguments);
            }
        } (nsMap.MapLayer.prototype.METHOD),
        */

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



