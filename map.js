mapboxgl.accessToken = 'pk.eyJ1IjoiZGFsbGFzcGx1bmtldHQiLCJhIjoiY203Yzk1aXc2MDF5eTJ0b2tyb2hkeDY3ZiJ9.GUfDb4KmwC9Z7l1aLeJhgQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18
});

map.on('load', () => {
    const route_style = {
        'line-color': 'steelblue',
        'line-width': 2,
        'line-opacity': 0.6
    }

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

    d3.json('https://dsc106.com/labs/lab07/data/bluebikes-stations.json').then(jsonData => {
        stations = jsonData.data.stations;

        circles = svg.selectAll('circle')
            .data(stations)
            .enter()
            .append('circle')
            .attr('r', 4)
            .attr('fill', 'orangered')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8);

        updatePositions();
    }).catch(error => {
        console.error('Error loading JSON:', error);
    });

    map.on('move', updatePositions);
    map.on('zoom', updatePositions);
    map.on('resize', updatePositions);
    map.on('moveend', updatePositions);
});
