$(document).ready(() => {
    let map = L.map('map').setView([49.007, 8.404], 14);
    let layerControl = undefined;
    let playerLocation = undefined;
    let playerAccuracyRadius = undefined;
    let unvisitedStationMarkers = [];
    let visitedStationMarkers = [];
    let overlaysTree = {
        label: ' Stations',
        selectAllCheckbox: 'un/select all',
        children: [],
    };
    let zones = new Set();

    // A green pin used to indicate a station that has been visited.
    let greenPin = L.icon({
        iconUrl: 'location-pin-icon-green.png',
        iconSize: [45, 45],
        iconAnchor: [22, 40],
        popupAnchor: [0, -34],
    });

    // A red pin used to indicate a station that has not been visited.
    let redPin = L.icon({
        iconUrl: 'location-pin-icon-red.png',
        iconSize: [45, 45],
        iconAnchor: [23, 40],
        popupAnchor: [0, -34],
    });

    // The icon used for the players location.
    let playerLocationIcon = L.icon({
        iconUrl: 'player-location-icon.png',
        iconSize: [45, 45],
        iconAnchor: [23, 23],
        popupAnchor: [0, -20],
    })

    // initialise OpenStreetMap
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // track player location
    map.locate({ watch: true });

    /**
     * Called each time the location of the player has been found.
     * Creates or updates the player location marker and accuracy radius on the map.
     * 
     * @param {Event} e Event containing the information about the players location.
     */
    function onLocationFound(e) {
        let radius = e.accuracy;
        if (playerLocation) { // location marker already exists
            playerLocation.setLatLng(e.latlng);
            playerLocation.setPopupContent(`You are within ${radius} meters from this point.`);
            playerAccuracyRadius.setLatLng(e.latlng);
            playerAccuracyRadius.setRadius(radius);
        }
        else { // location marker needs to be created
            playerLocation = L.marker(e.latlng, { icon: playerLocationIcon })
                .bindPopup(`You are within ${radius} meters from this point.`).addTo(map);
            playerAccuracyRadius = L.circle(e.latlng, radius).addTo(map);
            map.setView(e.latlng);
        }
        if (unvisitedStationMarkers.length > 0) {
            checkForStations(e.latlng, radius);
        }
    }
    map.on('locationfound', onLocationFound);

    /**
     * Called each time an error occured when searching for the players location.
     * 
     * @param {Event} e Event containing information about the error.
     */
    function onLocationError(e) {
        toast(false, e.message);
    }
    map.on('locationerror', onLocationError);

    /**
     * Set all stations inside the radius around the players location to be visited.
     * 
     * @param {L.LatLng} latlng A latitude, longitude object of Leaflet containing position to search around.
     * @param {Number} radius The radius to check for stations in.
     */
    function checkForStations(latlng, radius) {
        let stationsInRange = L.GeometryUtil.layersWithin(map, unvisitedStationMarkers.map((element) => element.marker),
            latlng, radius);
        moveToVisited(stationsInRange);
    }

    /**
     * Moves a station from the unvisited to the visited category in the label control tree.
     * Moves the marker from the collection of all unvisited makers to the collection of all visited markers.
     * Turns the icon of the marker green.
     * 
     * @param {L.Marker[]} stations The stations to move.
     */
    function moveToVisited(stations) {
        stations.forEach((station) => {
            let unvisitedMarkerIndex = unvisitedStationMarkers.findIndex((element) => element.marker == station); //find index of station in collection of all unvisited stations
            let zone = unvisitedStationMarkers[unvisitedMarkerIndex].zone; //get zone of station.
            let unvistedStations = overlaysTree.children.find((child) => child.label === ` ${zone}`).children[0].children; //all unvisited stations in zone of station
            let unvisitedIndex = unvistedStations.findIndex((element) => element.layer == station); // find index of station

            let visitedStation = unvistedStations.splice(unvisitedIndex, 1)[0]; //remove from unvisited in tree
            let name = visitedStation.label.slice(1); //remove whitespace added for formatting
            visitedStation.layer.setPopupContent(`${name} <br>
                <div class="form-check">
                    <label class="form-check-label" for="marker-checkbox-${name} checked">
                        Visited
                    </label>
                    <input class="form-check-input marker-checkbox" type="checkbox" id="marker-checkbox-${name}" checked>
                </div>`);
            overlaysTree.children.find((child) => child.label === ` ${zone}`).children[1].children.push(visitedStation); //add to visited in tree
            let visitedStationMarker = unvisitedStationMarkers.splice(unvisitedMarkerIndex, 1)[0]; //remove from collection of all unvisited markers
            visitedStationMarkers.push(visitedStationMarker); // add to collection of all visited markers
            station.setIcon(greenPin);
            visitedStationMarker.marker.closePopup();
        });
        if (!stopwatchStarted) {
            toggleStopwatch();
        }
        if (unvisitedStationMarkers.length === 0 && stopwatchStarted) {
            toggleStopwatch();
        }
        layerControl.setOverlayTree(overlaysTree);
    }


    /**
     * Moves a station from the visited to the unvisited category in the label control tree.
     * Moves the marker from the collection of all visited makers to the collection of all unvisited markers.
     * Turns the icon of the marker red.
     * 
     * @param {L.Marker[]} stations The stations to move.
     */
    function moveToUnvisited(stations) {
        stations.forEach((station) => {
            let visitedMarkerIndex = visitedStationMarkers.findIndex((element) => element.marker == station); //find index of station in collection of all visited stations
            let zone = visitedStationMarkers[visitedMarkerIndex].zone; //get zone of station
            let visitedStations = overlaysTree.children.find((child) => child.label === ` ${zone}`).children[1].children; //all visited stations in zone of station
            let visitedIndex = visitedStations.findIndex((element) => element.layer == station);

            let unvisitedStation = visitedStations.splice(visitedIndex, 1)[0]; // remove from visited in tree
            let name = unvisitedStation.label.slice(1);
            unvisitedStation.layer.setPopupContent(`${name} <br>
                <div class="form-check">
                    <label class="form-check-label" for="marker-checkbox-${name} checked">
                        Visited
                    </label>
                    <input class="form-check-input marker-checkbox" type="checkbox" id="marker-checkbox-${name}">
                </div>`);
            overlaysTree.children.find((child) => child.label === ` ${zone}`).children[0].children.push(unvisitedStation); //add to unvisited in tree
            let unvisitedStationMarker = visitedStationMarkers.splice(visitedMarkerIndex, 1)[0]; //remove from collection of all visited markers
            unvisitedStationMarkers.push(unvisitedStationMarker); //add to collection of all unvisited markers.
            station.setIcon(redPin);
            unvisitedStationMarker.marker.closePopup();
        });
        overlaysTree.children.forEach((child) => {
            child.children[0].children.sort((markerA, markerB) => markerA.label <= markerB.label ? -1 : 1);
        })
        layerControl.setOverlayTree(overlaysTree);
    }

    /**
     * Displays the stations given as a parameter on the map as red markers
     * and creates a tree structure in the layer control.
     * See Usage on https://github.com/jjimenezshaw/Leaflet.Control.Layers.Tree for examples of tree structures.
     * 
     * @param {Map<string, {name: string, lat: Number, lon: Number, zone: string}>} stations A map containing the stations.
     */
    function displayStations(stations) {
        stations.forEach((values) => {
            let currentZone = values.zone;
            let currentName = values.name;
            let marker = L.marker([values.lat, values.lon], { icon: redPin }).bindPopup(`${currentName} <br>
                <div class="form-check">
                    <label class="form-check-label" for="marker-checkbox-${currentName}">
                        Visited
                    </label>
                    <input class="form-check-input marker-checkbox" type="checkbox" value="" id="marker-checkbox-${currentName}">
                </div>`
            ).addTo(map);
            // Add a change event handler for marker checkboxes, when a popup is opened.
            marker.on('popupopen', () => {
                $('.marker-checkbox').on('change', (clickEvent) => {
                    if (clickEvent.target.checked) {
                        moveToVisited([marker]);
                    } else {
                        moveToUnvisited([marker]);
                    }
                })
            });
            // Remove the event handler created above if the popup is closed.
            marker.on('popupclose', () => $('.marker-checkbox').off('change'));
            unvisitedStationMarkers.push({ zone: currentZone, marker });
            if (zones.has(currentZone)) { // zone already has a node in tree
                // Traverse tree structure:
                // access children -> find child with zone as label -> access children of zone -> first child is unvisited stations
                // -> access children of unvisited stations -> add new station
                overlaysTree.children.find((child) => child.label === ` ${currentZone}`).children[0].children
                    .push({ label: ` ${currentName}`, layer: marker });
            } else { // zone doesn't have node in tree
                overlaysTree.children.push({ // set up the required nodes
                    label: ` ${currentZone}`,
                    selectAllCheckbox: 'un/select all',
                    children: [{
                        label: ' Unvisited Stations',
                        selectAllCheckbox: 'un/select all',
                        collapsed: true,
                        children: [{ label: ` ${currentName}`, layer: marker }],
                    }, {
                        label: ' Visited Stations',
                        selectAllCheckbox: 'un/select all',
                        children: [],
                    }],
                })
            }
            zones.add(currentZone);
        });
        overlaysTree.children.forEach((child) => {
            child.children[0].children.sort((markerA, markerB) => markerA.label <= markerB.label ? -1 : 1);
        })
        if (layerControl) { // layer control exists
            layerControl.setOverlayTree(overlaysTree);
        } else { // layer control needs to be created
            layerControl = L.control.layers.tree(undefined, overlaysTree).addTo(map);
        }
    }
    window.displayStations = displayStations;
});