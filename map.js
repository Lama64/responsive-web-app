$(document).ready(() => {
    let map = L.map('map').setView([49.007, 8.404], 14);
    let layerControl;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    map.locate({watch: true, maxZoom: 16});

    function onLocationFound(e) {
        let radius = e.accuracy;
        L.marker(e.latlng).addTo(map)
            .bindPopup("You are within " + radius + " meters from this point");
        L.circle(e.latlng, radius).addTo(map);
    }
    map.on('locationfound', onLocationFound);

    function onLocationError(e) {
        alert(e.message);
    }
    map.on('locationerror', onLocationError);

    function displayStations(stations) {
        let layerGroups = {};
        stations.forEach((values, _key, _map) => {
            if (`Zone ${values['zone']}` in layerGroups) {
                layerGroups[`Zone ${values['zone']}`]
                    .addLayer(L.marker([values['lat'], values['lon']]).bindPopup(values['name']));
            } else {
                layerGroups[`Zone ${values['zone']}`] 
                    = L.layerGroup([L.marker([values['lat'], values['lon']]).bindPopup(values['name'])]);
            }
        });
        layerControl = L.control.layers(null, layerGroups).addTo(map);
    }
    window.displayStations = displayStations;
});
