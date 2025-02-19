mapboxgl.accessToken = 'pk.eyJ1IjoiZGFsbGFzcGx1bmtldHQiLCJhIjoiY203Yzk1aXc2MDF5eTJ0b2tyb2hkeDY3ZiJ9.GUfDb4KmwC9Z7l1aLeJhgQ';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18
});
