$(document).ready(() => {
    //Get content of input file
    $('#stop-upload').on("change" ,(event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        let text;
        reader.readAsText(file);

        reader.onload = (e) => {
            text = e.target.result;
            try {
                displayStations(parseStops(text));
            } catch (error) {
                alert(error);
            }
        }
        reader.onerror = () => alert('Error loading file');
    })

    function parseStops(text) {
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
                {name: values[nameIndex], lat: values[latIndex], lon: values[lonIndex], zone: values[zoneIndex]});
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
