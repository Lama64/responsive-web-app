$(document).ready(() => {

    /**
     * Reaction to the submit event of the city search field.
     * Gives the input value to the stationsAPICall function.
     */
    $('.city-search-form').on("submit", async function (event) {
        event.preventDefault();
        let inputField = $(this).find('input');
        try {
            displayStations(await stationsAPICall(inputField.val()));
            inputField.blur();
            inputField.val('');
        } catch (error) {
            toast(false, error.message);
        }
    })

    /**
     * Calls the Overpass API to get all tram stations inside the given area.
     * See https://wiki.openstreetmap.org/wiki/Overpass_API for API information.
     * 
     * @param {String} geocodeArea The area to search.
     * @returns {Promise<Map<String, {name: String, lat: Number, lon: Number, zone: String}>>}
     *          A promise of a map containing the relavant information about the stations needed for the markers.
     * @throws Will throw an error if no suitable stations could be found.
     */
    async function stationsAPICall(geocodeArea) {
        let result = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                body: "data=" + encodeURIComponent(`
                        [out:json][timeout:100];
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
        let count = 0;
        for (let station of result.elements) {
            if (station.tags && station.lat && station.lon) { // only add nodes which contain the required information
                stations.set(station.id, { name: station.tags.name, lat: station.lat, lon: station.lon, zone: geocodeArea });
                count++;
            }
        }
        if (count === 0) {
            throw new Error("No stations found.");
        } else {
            toast(true, `${count} stations added.`);
        }
        return stations;
    }

    /**
     * Reaction to file upload.
     * Gives the file to the parser function.
     */
    $('#stop-upload').on("change", (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        let text;
        reader.readAsText(file);

        reader.onload = (e) => {
            text = e.target.result;
            //try {
            displayStations(parseStopsFile(text));
            //} catch (error) {
            //toast(false, error.message);
            // }
        }
        reader.onerror = () => toast(false, 'Error loading file.');
        $('#stop-upload').val('');
    })

    /**
     * Parses the input text to a map.
     * @param {String} text the text of the input file.
     * @returns {Map<String, {name: String, lat: Number, lon: Number, zone: String}>}
     *          A map containing the relavant information about the stations needed for the markers.
     * @throws Will throw an error if no suitable stations where found in the file.
     */
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
        let count = 0;
        for (let line of lines) {
            // " removed after split
            let matched = line.match(/(".*?")/g);
            if (!matched) { // skip lines with no matches
                continue;
            }
            const values = matched.map(value => value.replace(/^"|"$/g, ''));

            if (previousParentStation === values[parentIndex] && previousParentStation !== '') {
                continue; // station only needed once (each track listed seperately)
            }

            if (values[typeIndex] == 1) {
                continue; // parent stations have location_type 1, skip over them as they are not needed 
            }
            let zone = values[zoneIndex] ?? '';
            stations.set(values[idIndex],
                { name: values[nameIndex], lat: values[latIndex], lon: values[lonIndex], zone: 'Zone ' + zone });
            previousParentStation = values[parentIndex];
            count++;
        }
        if (count === 0) {
            throw new Error("No stations found in file.");
        } else {
            toast(true, `${count} stations added.`);
        }
        return stations;
    }

    /**
     * Finds the array index of the given index name.
     * 
     * @param {String} indexName The index name to find e.g. stop_name.
     * @param {String[]} array The array to search.
     * @param {Boolean} errorOnUndefined If true an error will be thrown if the array doesn't contain the index name.
     * @returns {Number | undefined} The array index of the index name or undefined if errorOnUndefined is false and the index name was not found.
     * @throws Will throw an error if errorOnUndefined is true and the index name was not found.
     */
    function findIndex(indexName, array, errorOnUndefined) {
        let index = array.findIndex((element) => element == indexName);
        if (errorOnUndefined && index === undefined) {
            throw new Error(`${indexName} needs to be present in file.`);
        }
        return index;
    }
})
