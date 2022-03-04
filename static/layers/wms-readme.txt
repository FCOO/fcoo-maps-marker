    From Leaflet documentation:
    L.tileLayer.wms(<String> baseUrl, <TileLayer.WMS options> options)

    baseUrl = URL template = A string of the following form:
    "http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png"

    {s} means one of the available subdomains (used sequentially to help with browser parallel requests per domain limitation; subdomain values are specified in options; a, b or c by default, can be omitted),
    {z} — zoom level,
    {x} and {y} — tile coordinates.
    {r} can be used to add "@2x" to the URL to load retina tiles.

    You can use custom keys in the template, which will be evaluated from TileLayer options, like this:

    L.tileLayer('http://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});

    options (gridLayer):
        tileSize            Number|Point    256             Width and height of tiles in the grid. Use a number if width and height are equal, or L.point(width, height) otherwise.
        opacity             Number          1.0             Opacity of the tiles. Can be used in the createTile() function.
        updateWhenIdle      Boolean         (depends)       Load new tiles only when panning ends. true by default on mobile browsers, in order to avoid too many requests and keep smooth navigation.
                                                            false otherwise in order to display new tiles during panning, since it is easy to pan outside the keepBuffer option in desktop browsers.
        updateWhenZooming   Boolean         true            By default, a smooth zoom animation (during a touch zoom or a flyTo()) will update grid layers every integer zoom level.
                                                            Setting this option to false will update the grid layer only when the smooth animation ends.
        updateInterval      Number          200             Tiles will not update more than once every updateInterval milliseconds when panning.
        zIndex              Number          1               The explicit zIndex of the tile layer.
        bounds              LatLngBounds    undefined  If   set, tiles will only be loaded inside the set LatLngBounds.
        minZoom             Number          0               The minimum zoom level down to which this layer will be displayed (inclusive).
        maxZoom             Number          undefined       The maximum zoom level up to which this layer will be displayed (inclusive).
        maxNativeZoom       Number          undefined       Maximum zoom number the tile source has available. If it is specified, the tiles on all zoom levels higher than maxNativeZoom will
                                                            be loaded from maxNativeZoom level and auto-scaled.
        minNativeZoom       Number          undefined       Minimum zoom number the tile source has available. If it is specified, the tiles on all zoom levels lower than minNativeZoom will
                                                            be loaded from minNativeZoom level and auto-scaled.
        noWrap              Boolean         false           Whether the layer is wrapped around the antimeridian. If true, the GridLayer will only be displayed once at low zoom levels.
                                                            Has no effect when the map CRS doesn't wrap around. Can be used in combination with bounds to prevent requesting tiles outside the CRS limits.
        pane                String          'tilePane'      Map pane where the grid layer will be added.
        className           String          ''              A custom class name to assign to the tile layer. Empty by default.
        keepBuffer          Number          2               When panning the map, keep this many rows and columns of tiles before unloading them.


    options (tileLayer):
        subdomains          String|String[] 'abc'           Subdomains of the tile service. Can be passed in the form of one string (where each letter is a subdomain name) or an array of strings.
        errorTileUrl        String          ''              URL to the tile image to show in place of the tile that failed to load.
        zoomOffset          Number          0               The zoom number used in tile URLs will be offset with this value.
        tms                 Boolean         false           If true, inverses Y axis numbering for tiles (turn this on for TMS services).
        zoomReverse         Boolean         false           If set to true, the zoom number used in tile URLs will be reversed (maxZoom - zoom instead of zoom)
        detectRetina        Boolean         false           If true and user is on a retina display, it will request four tiles of half the specified size and
                                                            a bigger zoom level in place of one to utilize the high resolution.
        crossOrigin         Boolean|String  false           Whether the crossOrigin attribute will be added to the tiles. If a String is provided, all tiles will have their crossOrigin
                                                            attribute set to the String provided. This is needed if you want to access tile pixel data. Refer to CORS Settings for valid String values.

    options (wms):
        layers              String          ''(required)    Comma-separated list of WMS layers to show.
        styles              String          ''              Comma-separated list of WMS styles.
        format              String          'image/jpeg'    WMS image format (use 'image/png' for layers with transparency).
        transparent         Boolean         false           If true, the WMS service will return images with transparency.
        version             String          '1.1.1'         Version of the WMS service to use
        crs                 CRS             null            Coordinate Reference System to use for the WMS requests, defaults to map CRS. Don't change this if you're not sure what it means.
        uppercase           Boolean         false           If true, WMS request parameter keys will be uppercase.
