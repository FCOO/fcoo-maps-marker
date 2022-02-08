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





        popupWidth          : 120,
        hasExtendedPopup    : true,
        extendedPopupWidth  : 200,

        latLng          : null,
        accuracy        : null,
        speed           : null,
        direction       : null,
        altitude        : null,
        altitudeAccuracy: null,
        orientation     : null,


        velocity        : 'not null', //Dummy value to allow popup content to check if speed and direction exists


        //popupContent = []ID or STRING of IDs = The values to include in popup
        popupContent: 'latLng',

        //legendContent:  = []ID or STRING of IDs = The values to include in legend. Default = popupContent

        buttonList  : [],
        centerButtonInlegend: true, //Adds a 'Center' button in legend

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
        //Adjust options
        options.markerOptions = $.extend(true, {}, this.defaultMarkerOptions, options.markerOptions);

        function adjust( content ){
            var asString = $.isArray(content) ? content.join(' ') : content;
            return asString/*.toUpperCase()*/.split(' ');
        }

        //popupContent = ids for content in popups
        options.popupContentIdList = adjust( options.markerOptions.popupContent );
        options.popupContentIdAsStr = options.popupContentIdList.join(' ');

        //legendContent = ids for content in legend. Default = popupContent
        options.markerOptions.legendContent = options.markerOptions.hasOwnProperty('legendContent') ? options.markerOptions.legendContent || '' : options.markerOptions.popupContent;
        options.legendContentIdList = adjust( options.markerOptions.legendContent );
        options.legendContentIdAsStr = options.legendContentIdList.join(' ');

        options.markerOptions = L.BsMarkerBase.prototype._adjustOptions( options.markerOptions );


        options.onAdd = $.proxy(this._onAdd, this);

        options.constructor = options.markerOptions.constructor;
        delete options.markerOptions.constructor;

        /* DEVELOPMENT
        var _this = this;
        options.markerOptions.buttonList = [
            {text:'dir + 10', onClick: function(){ _this.setDeltaDirection(10); } },
            {text:'Set size sm', onClick: function(){ _this.setSize('sm'); } },
            {text:'Set size nl', onClick: function(){ _this.setSize('nl'); } },
            {text:'Set size lg', onClick: function(){ _this.setSize('lg'); } },
        ];
        */

        options.buttonList = options.markerOptions.buttonList || [];

        if (options.markerOptions.centerButtonInlegend)
            options.buttonList.push({
                icon   : 'fa-crosshairs',
                text   : {da:'Centrér', en:'Center'},
                context: this,
                onClick: this._button_onClick_setCenter
            });


        nsMap.MapLayer.call(this, options);

        if (this.options.markerOptions.legendContent){
            this.options.content = this._getLegendContent();
            this.options.noVerticalPadding = true;
            this.options.noHorizontalPadding = true;
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
        createLayer: function(/*options*/){
            var markerOptions = this.options.markerOptions,
                marker = new this.options.constructor( markerOptions.latLng, markerOptions );

            marker.bindPopup( this.popupOptions() );

            marker.on('drag', this._drag, this);
            marker.on('dragstart', this._dragstart, this);
            marker.on('dragend', this._dragend, this);

            return marker;
        },


        /*****************************************************
        _onAdd
        *****************************************************/
        _onAdd: function(map){
            if (this.options.markerOptions.legendContent)
                this._updateLegendContent(map.fcooMapIndex);
        },

        /*****************************************************
        setCenter(map)
        *****************************************************/
        setCenter: function(map){
            map.setView(this.options.markerOptions.latLng, map.getZoom(), map._mapSync_NO_ANIMATION);
        },
        _button_onClick_setCenter: function(id, selected, $button, map){
            this.setCenter(map);
        },


        /*****************************************************
        _visitAllMaps
        Call methodName for all markers in all maps
        *****************************************************/
        _visitAllMaps: function(methodName, arg, onlyContentId = ''){
            var _this = this,
                updatePopupContent = true,
                updateLegendContent = true;

            if (onlyContentId)
                $.each(onlyContentId.split(' '), function(index, id){
                    updatePopupContent  = updatePopupContent  || _this.options.popupContentIdAsStr.includes(id);
                    updateLegendContent = updateLegendContent || _this.options.legendContentIdAsStr.includes(id);
                });

            $.each(this.info, function(mapIndex, info){
                if (info && info.layer){
                    if (info.layer[methodName])
                        info.layer[methodName].apply(info.layer, arg);

                    if (info.layer._popup && updatePopupContent)
                        info.layer._popup.changeContent(_this.popupOptions(), _this);
                }
                if (updateLegendContent)
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
            this.options.markerOptions = $.extend(true, this.options.markerOptions, options);
            return this._visitAllMaps('updateIcon', [this.options.markerOptions, forceColor]);
        },

        _drag: function(e){
            this.setLatLng(e.latlng);
        },

        //_dragstart: Set all popup.options.autoPan = false to allow popup to drag along
        _dragstart: function(/*e*/){
            $.each(this.info, function(id, info){
                info.layer._popup.options._save_autoPan = info.layer._popup.options.autoPan;
                info.layer._popup.options.autoPan = false;
            });
        },

        //_dragend: Reset popup.options.autoPan
        _dragend: function(/*e*/){
            $.each(this.info, function(id, info){
                info.layer._popup.options.autoPan = info.layer._popup.options._save_autoPan;
            });
        },


        /*****************************************************
        setLatLng(latLng)
        *****************************************************/
        setLatLng: function(latLng){
            this.options.markerOptions.latLng = latLng;
            this._visitAllMaps('setLatLng', arguments, 'latlng');
        },



        /*****************************************************
        setSize
        *****************************************************/
        setSize: function(size){
            this.options.markerOptions.size = size;
            return this._visitAllMaps('setSize', [size]);
        },


        /*****************************************************
        setDirection( direction )
        *****************************************************/
        setDirection: function( direction ){
            this.options.markerOptions.direction = (direction || 0) % 360;
            return this._visitAllMaps('setDirection', [direction], 'velocity orientation');
        },

        /*****************************************************
        setDeltaDirection( deltaDirection )
        *****************************************************/
        setDeltaDirection: function( deltaDirection = 0 ){
            return this.setDirection( this.options.markerOptions.direction + deltaDirection );
        },


        /*****************************************************
        asIcon()
        Return a json-record to be used as icon-options in any
        jquery-bootstrap content-options (eq. as header)
        *****************************************************/
        asIcon: function(){
            var markerOptions = this.options.markerOptions;
            return L.bsMarkerAsIcon(markerOptions.colorName, markerOptions.borderColorName, markerOptions.faClassName);
        },



        /*****************************************************
        popupOptions
        Returns the options for the markers popup
        *****************************************************/
        popupOptions: function(){
            var markerOptions = this.options.markerOptions,
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
                    content             : this._getFullPopupContent(false),

                    verticalButtons     : true,
                    buttons             : this.options.markerOptions.buttonList
                };

            if (markerOptions.hasExtendedPopup)
                result.extended = {
                    width               : markerOptions.extendedPopupWidth,
                    //noVerticalPadding   : false,
                    //noHorizontalPadding : true,
                    scroll              : false,
                    content             : this._getFullPopupContent(true),
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
            var markerOptions    = this.options.markerOptions,
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
                    if (extended && (markerOptions.accuracy !== null)){
                        var acc = Math.round(markerOptions.accuracy)+'m';
                        content = {
                            label: {icon: 'fa-plus-minus', text: {da: 'Nøjagtighed', en:'Accuracy'}},
//                            text : [{da:'Nøjagtigheden er ca. '+acc, en:'The accuracy is approx. '+acc}, ],
/*or*/                        text : [{da:'Ca. '+acc, en:'Approx. '+acc}, ],

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
            var markerOptions = this.options.markerOptions,
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
                markerOptions = this.options.markerOptions,
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



