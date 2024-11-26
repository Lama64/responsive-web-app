let map = L.map('map').setView([49.007, 8.404], 14);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

map.locate({setView: true, maxZoom: 16});
let marker = L.marker([49.00893729,8.41777117]).addTo(map);

function onLocationFound(e) {
    let radius = e.accuracy;

    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(map);
}
map.on('locationfound', onLocationFound);

function onLocationError(e) {
    alert(e.message);
}
map.on('locationerror', onLocationError);