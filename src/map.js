$(document).ready(() => {
    /**@type {L.Map} Map as main part of page.*/
    let map = L.map('map').setView([49.007, 8.404], 14);
    /**@type {L.Control} Layer control to enable and disable markers on map.*/
    let layerControl = undefined;
    /**@type {L.Marker} Marker of the players current position.*/
    let playerLocation = undefined;
    /**@type {L.Circle} Circle on the map indicating the accuracy radius of the players position.*/
    let playerAccuracyRadius = undefined;

    /**@type {{zone: String, marker: L.Marker}[]} All unvisited station markers.*/
    let unvisitedStationMarkers = [];
    /**@type {{zone: String, marker: L.Marker}[]} All visited station markers.*/
    let visitedStationMarkers = [];

    /**@typedef {{label: String, selectAllCheckbox?: String, children?: TreeObject[], collapsed?: Boolean, layer?: L.Layer, stationName?: String, visited?: Boolean}} TreeObject*/
    /**@type {TreeObject} Tree structure for the layer control.*/
    let overlaysTree = {
        label: ' Stations',
        selectAllCheckbox: 'un/select all',
        children: [],
    };

    /**@type {Set<String>} All zones added.*/
    let zones = new Set();
    window.zones = zones;

    /**@type {L.Icon} A green pin used to indicate a station that has been visited.*/
    let greenPin = L.icon({
        iconUrl: 'location-pin-icon-green.png',
        iconSize: [45, 45],
        iconAnchor: [22, 40],
        popupAnchor: [0, -34],
    });

    /**@type {L.Icon} A red pin used to indicate a station that has not been visited.*/
    let redPin = L.icon({
        iconUrl: 'location-pin-icon-red.png',
        iconSize: [45, 45],
        iconAnchor: [23, 40],
        popupAnchor: [0, -34],
    });

    /**@type {L.Icon} The icon used for the players location.*/
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
    map.locate({ watch: true, enableHighAccuracy: true });

    // load existing data
    loadData();

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
            playerLocation.setPopupContent(`You are within ${radius.toFixed(2)} meters from this point.`);
            playerAccuracyRadius.setLatLng(e.latlng);
            playerAccuracyRadius.setRadius(radius);
        }
        else { // location marker needs to be created
            playerLocation = L.marker(e.latlng, { icon: playerLocationIcon })
                .bindPopup(`You are within ${radius.toFixed(2)} meters from this point.`).addTo(map);
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
        if (radius > 100) {
            radius = 100; // limit radius to 100 meters
        }
        let stationsInRange = L.GeometryUtil.layersWithin(map, unvisitedStationMarkers.map((element) => element.marker),
            latlng, Math.max(radius, 30));
        if (stationsInRange.length > 0) {
            moveToVisited(stationsInRange.map((element) => element.layer));
        }
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
            let zoneInTree = overlaysTree.children.find((child) => child.label === ` ${zone}`);
            let unvistedStations = zoneInTree.children[0].children; //all unvisited stations in zone of station
            let unvisitedIndex = unvistedStations.findIndex((element) => element.layer == station); // find index of station

            let visitedStation = unvistedStations.splice(unvisitedIndex, 1)[0]; //remove from unvisited in tree
            let name = visitedStation.stationName;
            visitedStation.visited = true;
            visitedStation.layer.setPopupContent(`${name} <br>
                <div class="form-check">
                    <label class="form-check-label" for="marker-checkbox-${name} checked">
                        Visited
                    </label>
                    <input class="form-check-input marker-checkbox" type="checkbox" id="marker-checkbox-${name}" checked>
                </div>`);
            zoneInTree.children[1].children.push(visitedStation); //add to visited in tree
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
        saveData();
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
            let zoneInTree = overlaysTree.children.find((child) => child.label === ` ${zone}`);
            let visitedStations = zoneInTree.children[1].children; //all visited stations in zone of station
            let visitedIndex = visitedStations.findIndex((element) => element.layer == station);

            let unvisitedStation = visitedStations.splice(visitedIndex, 1)[0]; // remove from visited in tree
            let name = unvisitedStation.stationName;
            unvisitedStation.visited = false;
            unvisitedStation.layer.setPopupContent(`${name} <br>
                <div class="form-check">
                    <label class="form-check-label" for="marker-checkbox-${name} checked">
                        Visited
                    </label>
                    <input class="form-check-input marker-checkbox" type="checkbox" id="marker-checkbox-${name}">
                </div>`);
            zoneInTree.children[0].children.push(unvisitedStation); //add to unvisited in tree
            let unvisitedStationMarker = visitedStationMarkers.splice(visitedMarkerIndex, 1)[0]; //remove from collection of all visited markers
            unvisitedStationMarkers.push(unvisitedStationMarker); //add to collection of all unvisited markers.
            station.setIcon(redPin);
            unvisitedStationMarker.marker.closePopup();
        });
        overlaysTree.children.forEach((child) => {
            child.children[0].children.sort((markerA, markerB) => markerA.label <= markerB.label ? -1 : 1);
        })
        layerControl.setOverlayTree(overlaysTree);
        saveData();
    }

    /**
     * Deletes all stations in the given zone from the map and the layer control.
     * @param {String} zone The zone to delete.
     */
    async function deleteZone(zone) {
        overlaysTree.children.splice(overlaysTree.children.findIndex((child) => child.label === ` ${zone}`), 1); // remove from overlays tree
        for (let i = 0; i < unvisitedStationMarkers.length; i++) { // remove from map
            if (unvisitedStationMarkers[i].zone === zone) {
                // slow, function of library, can't easily be improved
                // slow if deleting a part of the markers, a lot faster if deleting most of the markers.
                map.removeLayer(unvisitedStationMarkers[i].marker);
            }
        }

        for (let i = 0; i < visitedStationMarkers.length; i++) {// remove from map
            if (visitedStationMarkers[i].zone === zone) {
                map.removeLayer(visitedStationMarkers[i].marker);
            }
        }
        unvisitedStationMarkers = unvisitedStationMarkers.filter((element) => element.zone !== zone); // remove from collection of all unvisited stations
        visitedStationMarkers = visitedStationMarkers.filter((element) => element.zone !== zone); // remove from collection of all visited stations
        zones.delete(zone);
        layerControl.setOverlayTree(overlaysTree);
        saveData();
    }
    window.deleteZone = deleteZone;

    /**
     * Displays the stations given as a parameter on the map as red markers
     * and creates a tree structure in the layer control.
     * See Usage on https://github.com/jjimenezshaw/Leaflet.Control.Layers.Tree for examples of tree structures.
     * 
     * @param {Map<String, {name: String, lat: Number, lon: Number, zone: String}>} stations A map containing the stations.
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
            attachEventHandlers(marker);
            unvisitedStationMarkers.push({ zone: currentZone, marker });
            if (zones.has(currentZone)) { // zone already has a node in tree
                // Traverse tree structure:
                // access children -> find child with zone as label -> access children of zone -> first child is unvisited stations
                // -> access children of unvisited stations -> add new station
                overlaysTree.children.find((child) => child.label === ` ${currentZone}`).children[0].children
                    .push({
                        label: ` ${currentName}`,
                        layer: marker,
                        zone: currentZone,
                        stationName: currentName,
                        visited: false
                    });
            } else { // zone doesn't have node in tree
                overlaysTree.children.push({ // set up the required nodes
                    label: ` ${currentZone}`,
                    selectAllCheckbox: 'un/select all',
                    children: [{
                        label: ' Unvisited Stations',
                        selectAllCheckbox: 'un/select all',
                        collapsed: true,
                        children: [{
                            label: ` ${currentName}`,
                            layer: marker,
                            zone: currentZone,
                            stationName: currentName,
                            visited: false
                        }],
                    }, {
                        label: ' Visited Stations',
                        selectAllCheckbox: 'un/select all',
                        children: [],
                    }],
                })
                addToMenuZonesList(currentZone);
            }
            zones.add(currentZone);
        });
        overlaysTree.children.forEach((child) => {
            child.children[0].children.sort((markerA, markerB) => markerA.label <= markerB.label ? -1 : 1);
        });
        if (layerControl) { // layer control exists
            layerControl.setOverlayTree(overlaysTree);
        } else { // layer control needs to be created
            layerControl = L.control.layers.tree(undefined, overlaysTree, { position: 'topleft' }).addTo(map);
        }
        saveData();
    }
    window.displayStations = displayStations;

    /**
     * Attaches event handlers to the marker to handle the checkbox in the popup.
     * 
     * @param {L.Marker} marker The marker to attach the event handlers to.
     */
    function attachEventHandlers(marker) {
        marker.on('popupopen', () => {
            $('.marker-checkbox').on('change', (clickEvent) => {
                if (clickEvent.target.checked) {
                    moveToVisited([marker]);
                } else {
                    moveToUnvisited([marker]);
                }
            })
        });
        marker.on('popupclose', () => $('.marker-checkbox').off('change'));
    }

    /**
     * Saves the current state of the stations and the elapsed time to the local storage.
     */
    function saveData() {
        let stringTree = JSON.stringify(overlaysTree, function (key, value) {
            if (key === 'layer') {
                return { latlng: value.getLatLng(), content: value.getPopup().getContent() };
            }
            return value;
        });
        localStorage.setItem('overlaysTree', stringTree);
        localStorage.setItem('elapsedTime', elapsedTime);
    }

    /**
     * Loads the data from the local storage and recreates the stations and the elapsed time.
     */
    function loadData() {
        let storedTree = localStorage.getItem('overlaysTree');
        if (!storedTree) {
            return;
        }
        overlaysTree = JSON.parse(storedTree, function (key, value) {
            if (key === 'layer' && value?.latlng) {
                let marker;
                if (this.visited) {
                    marker = L.marker(value.latlng, { icon: greenPin }).bindPopup(value.content).addTo(map);
                    visitedStationMarkers.push({ zone: this.zone, marker });

                } else {
                    marker = L.marker(value.latlng, { icon: redPin }).bindPopup(value.content).addTo(map);
                    unvisitedStationMarkers.push({ zone: this.zone, marker });
                }
                if (!(zones.has(this.zone))) {
                    addToMenuZonesList(this.zone);
                }
                zones.add(this.zone);
                attachEventHandlers(marker);
                return marker;
            }
            return value;
        });
        layerControl = L.control.layers.tree(undefined, overlaysTree, { position: 'topleft' }).addTo(map);
        elapsedTime = localStorage.getItem('elapsedTime');
        updateStopwatchDisplay();
    }
});