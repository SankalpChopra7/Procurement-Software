import { procurement, countyMeta, solvSites } from './data.js';

fetch('data.json')
  .then(r => r.json())
  .then(data => {
    // Merge in the parsed JSON data
    Object.assign(procurement, data.procurement);
    Object.assign(countyMeta.CA, data.countyMeta.CA);
    Object.assign(countyMeta.AZ, data.countyMeta.AZ);
    Object.assign(countyMeta.TX, data.countyMeta.TX);

    // Replace contents of solvSites array
    solvSites.splice(0, solvSites.length, ...data.solvSites);

    initLeaflet();
    initCesium();
  })
  .catch(err => {
    console.error(err);
    alert('Failed to load data');
    const el = document.getElementById('errorMessage');
    if (el) el.classList.remove('hidden');
  });

function contactUrl(company) {
  return 'https://www.google.com/search?q=' +
    encodeURIComponent(company + ' contact information');
}

function mapUrl(company, county, state) {
  return 'https://www.google.com/maps/search/' +
    encodeURIComponent(company + ', ' + county + ' County, ' + state);
}

let map, light, dark;
const layers = {};
let solvLayer;

function initLeaflet() {
  light = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  });
  dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  });

  map = L.map('map', {
    center: [37.8, -96],
    zoom: 4,
    layers: [light]
  });

  ['CA', 'AZ', 'TX'].forEach(state => {
    const group = L.layerGroup();
    const countyServices = {};

    procurement[state].forEach(row => {
      const c = row.County;
      (countyServices[c] = countyServices[c] || []).push(row);
    });

    Object.entries(countyServices).forEach(([county, rows]) => {
      const meta = countyMeta[state][county];
      if (!meta) return;

      const itemsHtml = rows.map(r => {
        const notes = r.Notes ? ` (${r.Notes})` : '';
        const comp  = r['Company Name'];
        const serv  = r['Service Type'];
        const contactLink = contactUrl(comp);
        const mapLink     = mapUrl(comp, county, state);
        return `
          <li>
            <strong>${serv}</strong> – ${comp}${notes}
            [<a href="${contactLink}" target="_blank">Contact</a>]
            [<a href="${mapLink}"    target="_blank">Map</a>]
          </li>`;
      }).join('');

      const popupHtml = `
        <h3 class="font-semibold mb-1">${county} County (${state})</h3>
        <ul class="popup-list">${itemsHtml}</ul>
      `;

      L.marker([meta.lat, meta.lon])
        .bindPopup(popupHtml)
        .addTo(group);
    });

    layers[state] = group.addTo(map);
  });

  solvLayer = L.layerGroup();
  solvSites.forEach(s => {
    L.circleMarker([s.lat, s.lon], {
      radius: 6,
      color: 'orange',
      fillColor: 'orange',
      fillOpacity: 0.8
    })
    .bindPopup(`
      <strong>${s.name}</strong><br>
      AC: ${s.capacity_ac}<br>
      DC: ${s.capacity_dc}<br>
      ${s.client}
    `)
    .addTo(solvLayer);
  });
  solvLayer.addTo(map);

  L.control.layers(
    { Light: light, Dark: dark },
    {
      'California':      layers.CA,
      'Arizona':         layers.AZ,
      'Texas':           layers.TX,
      'SOLV BESS Sites': solvLayer
    }
  ).addTo(map);
}

let viewer;
const cesiumStates = { CA: [], AZ: [], TX: [], SOLV: [] };

function initCesium() {
  viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c']
    }),
    baseLayerPicker: false,
    terrainProvider: Cesium.createWorldTerrain()
  });

  const pinUrl = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png';

  ['CA', 'AZ', 'TX'].forEach(state => {
    const countyServices = {};
    procurement[state].forEach(r => {
      const c = r.County;
      (countyServices[c] = countyServices[c] || []).push(r);
    });

    Object.entries(countyServices).forEach(([county, rows]) => {
      const meta = countyMeta[state][county];
      if (!meta) return;

      const itemsHtml = rows.map(r => {
        const notes = r.Notes ? ` (${r.Notes})` : '';
        const comp  = r['Company Name'];
        const serv  = r['Service Type'];
        const contactLink = contactUrl(comp);
        const mapLink     = mapUrl(comp, county, state);
        return `
          <li>
            <strong>${serv}</strong> – ${comp}${notes}
            [<a href="${contactLink}" target="_blank">Contact</a>]
            [<a href="${mapLink}"    target="_blank">Map</a>]
          </li>`;
      }).join('');

      const description = `
        <h3 class="font-semibold mb-1">${county} County (${state})</h3>
        <ul class="popup-list">${itemsHtml}</ul>
      `;

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(meta.lon, meta.lat),
        billboard: { image: pinUrl, scale: 0.5 },
        description
      });
      cesiumStates[state].push(entity);
    });
  });

  solvSites.forEach(s => {
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat),
      point: { pixelSize: 10, color: Cesium.Color.ORANGE },
      description: `
        <strong>${s.name}</strong><br>
        AC: ${s.capacity_ac}<br>
        DC: ${s.capacity_dc}<br>
        ${s.client}
      `
    });
    cesiumStates.SOLV.push(entity);
  });
}

// UI toggles for 2D/3D and theme
function toggleEntities(state, show) {
  cesiumStates[state].forEach(e => e.show = show);
}
document.getElementById('btn2d').onclick = () => {
  document.getElementById('cesiumContainer').style.display = 'none';
  document.getElementById('map').style.display = 'block';
  if (map) map.invalidateSize();
};
document.getElementById('btn3d').onclick = () => {
  document.getElementById('map').style.display = 'none';
  document.getElementById('cesiumContainer').style.display = 'block';
};
document.getElementById('themeToggle').addEventListener('change', e => {
  document.body.classList.toggle('dark', e.target.checked);
  if (e.target.checked) {
    if (map.hasLayer(light)) { map.removeLayer(light); dark.addTo(map); }
    viewer.scene.imageryLayers.get(0).imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      subdomains: ['a', 'b', 'c']
    });
  } else {
    if (map.hasLayer(dark)) { map.removeLayer(dark); light.addTo(map); }
    viewer.scene.imageryLayers.get(0).imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c']
    });
  }
});
