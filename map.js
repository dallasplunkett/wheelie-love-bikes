mapboxgl.accessToken = 'pk.eyJ1IjoiZGFsbGFzcGx1bmtldHQiLCJhIjoiY203Yzk1aXc2MDF5eTJ0b2tyb2hkeDY3ZiJ9.GUfDb4KmwC9Z7l1aLeJhgQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18
});

function minutesSinceMidnight(date) {
    return date.getHours() * 60 + date.getMinutes();
}

map.on('load', () => {
    const route_style = {
        'line-color': 'steelblue',
        'line-width': 2,
        'line-opacity': 0.6
    };

    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
    });

    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
    });

    map.addLayer({
        id: 'bike-lanes-1',
        type: 'line',
        source: 'boston_route',
        paint: route_style
    });

    map.addLayer({
        id: 'bike-lanes-2',
        type: 'line',
        source: 'cambridge_route',
        paint: route_style
    });

    const svg = d3.select('#map').select('svg');
    let stations = [];
    let circles;
    let trips = [];
    let departures;
    let arrivals;

    let timeFilter = -1;
    const timeSlider = document.getElementById('time-slider');
    const selectedTime = document.getElementById('selected-time');
    const anyTimeLabel = document.getElementById('any-time');

    timeSlider.addEventListener('input', updateTimeDisplay);
    updateTimeDisplay();

    d3.json('https://dsc106.com/labs/lab07/data/bluebikes-stations.json').then(jsonData => {
        stations = jsonData.data.stations;

        d3.csv('https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv').then(csvData => {
            trips = csvData;

            for (let trip of trips) {
                trip.started_at = new Date(trip.started_at);
                trip.ended_at = new Date(trip.ended_at);
            }

            departures = d3.rollup(
                trips,
                (v) => v.length,
                (d) => d.start_station_id,
            );

            arrivals = d3.rollup(
                trips,
                v => v.length,
                d => d.end_station_id
            );

            stations = stations.map(station => {
                let id = station.short_name;
                station.arrivals = arrivals.get(id) ?? 0;
                station.departures = departures.get(id) ?? 0;
                station.totalTraffic = station.arrivals + station.departures;
                return station;
            });

            updateCircles(stations);
        }).catch(error => {
            console.error('Error loading CSV:', error);
        });
    }).catch(error => {
        console.error('Error loading JSON:', error);
    });

    map.on('move', updatePositions);
    map.on('zoom', updatePositions);
    map.on('resize', updatePositions);
    map.on('moveend', updatePositions);

    function getCoords(station) {
        const point = new mapboxgl.LngLat(+station.lon, +station.lat);
        const { x, y } = map.project(point);
        return { cx: x, cy: y };
    }

    function updatePositions() {
        circles
            .attr('cx', d => getCoords(d).cx)
            .attr('cy', d => getCoords(d).cy);
    }

    function formatTime(minutes) {
        const date = new Date(0, 0, 0, 0, minutes);
        return date.toLocaleString('en-US', { timeStyle: 'short' });
    }

    function filterTripsByTime(timeVal) {
        if (timeVal === -1) {
            // No filter selected, so return everything
            return {
                filteredTrips: trips,
                filteredArrivals: arrivals,
                filteredDepartures: departures,
                filteredStations: stations
            };
        }

        // Filter trips to only those that start OR end within ±60 minutes
        const filteredTrips = trips.filter((t) => {
            const startedMinutes = minutesSinceMidnight(t.started_at);
            const endedMinutes = minutesSinceMidnight(t.ended_at);
            return (
                Math.abs(startedMinutes - timeVal) <= 60 ||
                Math.abs(endedMinutes - timeVal) <= 60
            );
        });

        // Recompute rollups for the filtered set
        const filteredDepartures = d3.rollup(
            filteredTrips,
            (v) => v.length,
            (d) => d.start_station_id
        );

        const filteredArrivals = d3.rollup(
            filteredTrips,
            (v) => v.length,
            (d) => d.end_station_id
        );

        // Create a new array of stations with updated arrivals, departures, totalTraffic
        const filteredStations = stations.map(station => {
            // clone station to avoid mutating the original
            let newStation = { ...station };
            let id = newStation.short_name;

            newStation.arrivals = filteredArrivals.get(id) ?? 0;
            newStation.departures = filteredDepartures.get(id) ?? 0;
            newStation.totalTraffic = newStation.arrivals + newStation.departures;
            return newStation;
        });

        return {
            filteredTrips,
            filteredArrivals,
            filteredDepartures,
            filteredStations
        };
    }

    function updateCircles(stationData) {

        // Conditionally scale the radius if timeFilter is on or not
        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(stationData, (d) => d.totalTraffic)])
            .range(timeFilter === -1 ? [0, 20] : [3, 30]);

        // Join the data
        circles = svg
            .selectAll('circle')
            .data(stationData, d => d.short_name)
            .join('circle')
            .attr('fill', 'orangered')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8)
            .attr('r', d => radiusScale(d.totalTraffic));

        // Update the tooltip
        circles.selectAll('title').remove();
        circles.append('title')
            .text(d =>
                `${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`
            );

        // After updating the data, reposition circles on the map
        updatePositions();
    }

    function updateTimeDisplay() {
        timeFilter = Number(timeSlider.value);

        if (timeFilter === -1) {
            selectedTime.textContent = '';
            anyTimeLabel.style.display = 'block';
        } else {
            selectedTime.textContent = formatTime(timeFilter);
            anyTimeLabel.style.display = 'none';
        }

        // Now do the actual filtering
        const {
            filteredTrips,
            filteredArrivals,
            filteredDepartures,
            filteredStations
        } = filterTripsByTime(timeFilter);

        // Redraw the circles with the filtered station data
        updateCircles(filteredStations);
    }
});