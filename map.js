$(document).ready(() => {
    let map = L.map('map').setView([49.007, 8.404], 14);
    let layerControl = undefined;
    let playerLocation = undefined;
    let playerAccuracyRadius = undefined;
    let stationMarkers = [];

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
            playerLocation = L.marker(e.latlng, { icon: playerLocationIcon }).bindPopup(`You are within ${radius} meters from this point.`).addTo(map);
            playerAccuracyRadius = L.circle(e.latlng, radius).addTo(map);
            map.setView(e.latlng);
        }
        if (stationMarkers.length > 0) {
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
        let stationsInRange = L.GeometryUtils.layersWithin(map, stationMarkers, latlng, radius);
        for (let station of stationsInRange) {
            station.setIcon(greenPin);
            // TODO: move to visited group.
        }
    }

    /**
     * Displays the stations given as a parameter on the map as red markers.
     * 
     * @param {Map<string, {name: string, lat: Number, lon: Number, zone: string}>} stations A map containing the stations.
     */
    function displayStations(stations) {
        let layerGroups = {};
        stations.forEach((values) => {
            let marker = L.marker([values['lat'], values['lon']], { icon: redPin }).bindPopup(values['name']);
            stationMarkers.push(marker);
            if (`${values['zone']}` in layerGroups) { // layer group exists with zone name
                layerGroups[`${values['zone']}`]
                    .addLayer(marker).addTo(map);
            } else { // layer group needs to be created
                layerGroups[`${values['zone']}`]
                    = L.layerGroup([marker]).addTo(map);
            }
        });
        if (layerControl) { // layer control exists
            for (let group in layerGroups) {
                layerControl.addOverlay(layerGroups[group], group).addTo(map);
            };
        } else { // layer control needs to be created
            layerControl = L.control.layers(null, layerGroups).addTo(map);
        }
    }
    window.displayStations = displayStations;
});
