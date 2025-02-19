mapboxgl.accessToken = 'pk.eyJ1IjoiZGFsbGFzcGx1bmtldHQiLCJhIjoiY203Yzk1aXc2MDF5eTJ0b2tyb2hkeDY3ZiJ9.GUfDb4KmwC9Z7l1aLeJhgQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18
});

const route_style = {
    'line-color': 'green',
    'line-width': 2,
    'line-opacity': 0.6
}

map.on('load', () => {
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
});