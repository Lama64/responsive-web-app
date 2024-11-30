$(document).ready(() => {

    $('.city-search-form').on("submit", async function (event) {
        event.preventDefault();
        let inputField =  $(this).find('input');
        displayStations(await stationsAPICall(inputField.val()));
        inputField.blur();
        inputField.val('');
    })

    // call overpass API to get tram stations of city and convert to map object
    async function stationsAPICall(geocodeArea) {
        let result = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                body: "data="+ encodeURIComponent(`
                        [out:json][timeout:25];
                        // Define the area by the city name
                        area[name="${geocodeArea}"]->.searchArea;

                        // Fetch all tram stations in the area
                        (
                        node["railway"="tram_stop"](area.searchArea);
                        way["railway"="tram_stop"](area.searchArea);
                        relation["railway"="tram_stop"](area.searchArea);
                        );

                        // Output the results
                        out body;
                        >;
                        out skel qt;
                    `)
            },
        ).then((data) => data.json());
        let stations = new Map();
        for (let station of result.elements) {
            if (!(station.tags) || !(station.lat) || !(station.lon)) {
                continue; // skip node if required data not available
            }
            stations.set(station.id, {name: station.tags.name, lat: station.lat, lon: station.lon, zone: geocodeArea});
        }
        return stations;
    }

    // Get content of input file
    $('#stop-upload').on("change", (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        let text;
        reader.readAsText(file);

        reader.onload = (e) => {
            text = e.target.result;
            try {
                displayStations(parseStopsFile(text));
            } catch (error) {
                alert(error);
            }
        }
        reader.onerror = () => alert('Error loading file');
    })

    // convert lines to map object
    function parseStopsFile(text) {
        let lines = text.trim().split(/\r?\n/);
        const indices = lines[0].split(',').map(value => value.replace(/^"|"$/g, ''));
        let idIndex = findIndex('stop_id', indices, true);
        let nameIndex = findIndex('stop_name', indices, true);
        let latIndex = findIndex('stop_lat', indices, true);
        let lonIndex = findIndex('stop_lon', indices, true);
        let zoneIndex = findIndex('zone_id', indices, false);
        let typeIndex = findIndex('location_type', indices, false);
        let parentIndex = findIndex('parent_station', indices, false);

        lines = lines.slice(1); // first line contains format, no longer needed
        let previousParentStation = '';
        let stations = new Map();
        for (let line of lines) {
            // " removed after split
            const values = line.split(',').map(value => value.replace(/^"|"$/g, ''));

            if (previousParentStation === values[parentIndex] && previousParentStation !== '') {
                continue; // station only needed once (each track listed seperately)
            }

            if (values[typeIndex]) { 
                break; // parent stations listed seperately at end of file with location_type 1, not needed again
            }

            stations.set(values[idIndex],
                {name: values[nameIndex], lat: values[latIndex], lon: values[lonIndex], zone: 'Zone ' + values[zoneIndex]});
            previousParentStation = values[parentIndex];
        }
        return stations;
    }

    function findIndex(indexName, array, errorOnUndefined) {
        let index = array.findIndex((element) => element == indexName);
        if (errorOnUndefined && index === undefined) {
            throw new Error(`${indexName} needs to be present in file!`);
        }
        return index;
    }
})
