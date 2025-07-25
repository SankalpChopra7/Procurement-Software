const procurement = { CA: [], AZ: [], TX: [] };
const countyMeta = { CA: {}, AZ: {}, TX: {} };
let solvSites = [];

fetch('data.json')
  .then(r => r.json())
  .then(data => {
    Object.assign(procurement, data.procurement);
    Object.assign(countyMeta.CA, data.countyMeta.CA);
    Object.assign(countyMeta.AZ, data.countyMeta.AZ);
    Object.assign(countyMeta.TX, data.countyMeta.TX);
    solvSites = data.solvSites;
    initLeaflet();
    initCesium();
  });

function contactUrl(company) {
  return 'https://www.google.com/search?q=' + encodeURIComponent(company + ' contact information');
}
function mapUrl(company, county, state) {
  return 'https://www.google.com/maps/search/' + encodeURIComponent(company + ', ' + county + ' County, ' + state);
}
let map, light, dark, layers = {}, solvLayer;
function initLeaflet() {
  light = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' });
  dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' });
  map = L.map('map', { center: [37.8, -96], zoom: 4, layers: [light] });
  for (const state of ['CA', 'AZ', 'TX']) {
    const group = L.layerGroup();
    const countyServices = {};
    procurement[state].forEach(row => {
      const c = row['County'];
      (countyServices[c] = countyServices[c] || []).push(row);
    });
    for (const county in countyServices) {
      const meta = countyMeta[state][county];
      if (!meta) continue;
      const items = countyServices[county].map(r => {
        const notes = r['Notes'] ? ` (${r['Notes']})` : '';
        const comp = r['Company Name'];
        const serv = r['Service Type'];
        const contact = contactUrl(comp);
        const mapu = mapUrl(comp, county, state);
        return `<li><strong>${serv}</strong> – ${comp}${notes} [<a href="${contact}" target="_blank">Contact</a>] [<a href="${mapu}" target="_blank">Map</a>]</li>`;
      }).join('');
      const popup = `<h3 class="font-semibold mb-1">${county} County (${state})</h3><ul class="popup-list">${items}</ul>`;
      L.marker([meta.lat, meta.lon]).bindPopup(popup).addTo(group);
    }
    layers[state] = group.addTo(map);
  }
  solvLayer = L.layerGroup();
  solvSites.forEach(s => {
    L.circleMarker([s.lat, s.lon], { radius: 6, color: 'orange', fillColor: 'orange', fillOpacity: 0.8 }).bindPopup(`<strong>${s.name}</strong><br>AC: ${s.capacity_ac}<br>DC: ${s.capacity_dc}<br>${s.client}`).addTo(solvLayer);
  });
  solvLayer.addTo(map);
  L.control.layers({ Light: light, Dark: dark }, { California: layers.CA, Arizona: layers.AZ, Texas: layers.TX, 'SOLV BESS Sites': solvLayer }).addTo(map);
}
let viewer, cesiumStates = { CA: [], AZ: [], TX: [], SOLV: [] };
function initCesium() {
  viewer = new Cesium.Viewer('cesiumContainer', { imageryProvider: new Cesium.UrlTemplateImageryProvider({ url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: ['a', 'b', 'c'] }), baseLayerPicker: false, terrainProvider: Cesium.createWorldTerrain() });
  const pin = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png';
  for (const state of ['CA', 'AZ', 'TX']) {
    const countyServices = {};
    procurement[state].forEach(r => {
      const c = r['County'];
      (countyServices[c] = countyServices[c] || []).push(r);
    });
    for (const county in countyServices) {
      const meta = countyMeta[state][county];
      if (!meta) continue;
      const items = countyServices[county].map(r => {
        const notes = r['Notes'] ? ` (${r['Notes']})` : '';
        const comp = r['Company Name'];
        const serv = r['Service Type'];
        const contact = contactUrl(comp);
        const mapu = mapUrl(comp, county, state);
        return `<li><strong>${serv}</strong> – ${comp}${notes} [<a href="${contact}" target="_blank">Contact</a>] [<a href="${mapu}" target="_blank">Map</a>]</li>`;
      }).join('');
      const desc = `<h3 class=\"font-semibold mb-1\">${county} County (${state})</h3><ul class=\"popup-list\">${items}</ul>`;
      const entity = viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(meta.lon, meta.lat), billboard: { image: pin, scale: 0.5 }, description: desc });
      cesiumStates[state].push(entity);
    }
  }
  solvSites.forEach(s => {
    const entity = viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat), point: { pixelSize: 10, color: Cesium.Color.ORANGE }, description: `<strong>${s.name}</strong><br>AC: ${s.capacity_ac}<br>DC: ${s.capacity_dc}<br>${s.client}` });
    cesiumStates.SOLV.push(entity);
  });
}
function toggleEntities(state, show) { cesiumStates[state].forEach(e => e.show = show); }
const btn2d = document.getElementById('btn2d');
const btn3d = document.getElementById('btn3d');
btn2d.onclick = () => { document.getElementById('cesiumContainer').style.display = 'none'; document.getElementById('map').style.display = 'block'; if (map) map.invalidateSize(); };
btn3d.onclick = () => { document.getElementById('map').style.display = 'none'; document.getElementById('cesiumContainer').style.display = 'block'; };
document.getElementById('themeToggle').addEventListener('change', e => {
  document.body.classList.toggle('dark', e.target.checked);
  if (e.target.checked) {
    if (map.hasLayer(light)) { map.removeLayer(light); dark.addTo(map); }
    viewer.scene.imageryLayers.get(0).imageryProvider = new Cesium.UrlTemplateImageryProvider({ url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', subdomains: ['a', 'b', 'c'] });
  } else {
    if (map.hasLayer(dark)) { map.removeLayer(dark); light.addTo(map); }
    viewer.scene.imageryLayers.get(0).imageryProvider = new Cesium.UrlTemplateImageryProvider({ url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: ['a', 'b', 'c'] });
  }
});
