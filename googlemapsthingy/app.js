// app.js
// Updated demo: no use of PlacesServiceStatus constants, uses Place/PlaceResult objects,
// reads business_status (OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY).

const PLACE_TYPES = ['park', 'stadium', 'campground'];
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (demo)

function setStatus(text){
  document.getElementById('status').textContent = 'Status: ' + text;
}
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function roundCoord(v, dec=5){ return Math.round(v * Math.pow(10,dec)) / Math.pow(10,dec); }

function makeCacheKey(lat, lng, radius, types, density) {
  return `places_cache:${roundCoord(lat,4)}:${roundCoord(lng,4)}:r${radius}:t${types.join(',')}:d${density}`;
}
function saveCache(key, data) {
  localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
}
function loadCache(key) {
  const raw = localStorage.getItem(key);
  if(!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if(Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch(e) { return null; }
}

// destinationPoint (great-circle)
function destinationPoint(lat, lng, bearingDeg, distanceMeters) {
  const R = 6378137;
  const φ1 = lat * Math.PI/180;
  const λ1 = lng * Math.PI/180;
  const θ = bearingDeg * Math.PI/180;
  const δ = distanceMeters / R;

  const sinφ2 = Math.sin(φ1)*Math.cos(δ) + Math.cos(φ1)*Math.sin(δ)*Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const y = Math.sin(θ)*Math.sin(δ)*Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1)*sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return { lat: φ2*180/Math.PI, lng: ((λ2*180/Math.PI)+540)%360 - 180 };
}

// Collect all pages from nearbySearch — note: status is a string (e.g. 'OK' / 'ZERO_RESULTS')
function nearbySearchAllPages(service, request) {
  return new Promise((resolve, reject) => {
    const collected = [];
    function callback(results, status, pagination) {
      // Avoid referencing google.maps.places.PlacesServiceStatus constants — check status strings
      if (status !== 'OK' && status !== 'ZERO_RESULTS') {
        return reject(new Error('Places API error: ' + status));
      }
      if (results && results.length) collected.push(...results);
      if (pagination && pagination.hasNextPage) {
        // required short delay before calling nextPage()
        setTimeout(() => pagination.nextPage(), 1000);
      } else {
        resolve(collected);
      }
    }
    service.nearbySearch(request, callback);
  });
}

let map, markers = [];
function clearMarkers() { markers.forEach(m=>m.setMap(null)); markers=[]; }
function addMarker(place, mapInstance) {
  if(!place.geometry || !place.geometry.location) return;
  const marker = new google.maps.Marker({
    position: place.geometry.location,
    map: mapInstance,
    title: place.name
  });
  const businessStatus = place.business_status || 'UNKNOWN';
  const content = `<strong>${place.name}</strong><br/>
                   <small>${place.vicinity || place.formatted_address || ''}</small><br/>
                   <small>status: ${businessStatus}</small>`;
  const infowindow = new google.maps.InfoWindow({ content });
  marker.addListener('click', () => infowindow.open(mapInstance, marker));
  markers.push(marker);
}

function showResultsList(places) {
  const box = document.getElementById('results');
  box.innerHTML = '';
  places.forEach(p => {
    const div = document.createElement('div');
    div.className = 'result';
    const name = document.createElement('h4');
    name.textContent = p.name;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `${p.types ? p.types.join(', ') : ''} <br/> ${p.vicinity || p.formatted_address || ''}<br/>Status: ${p.business_status || 'UNKNOWN'}`;
    div.appendChild(name);
    div.appendChild(meta);
    box.appendChild(div);
  });
  document.getElementById('count').textContent = places.length;
}

async function searchAround(centerLatLng, radius = 5000, peripheralCount = 8, includeTempClosed=false) {
  setStatus('Preparing search...');
  const centers = [];
  centers.push({ lat: centerLatLng.lat(), lng: centerLatLng.lng(), label: 'center' });
  if(peripheralCount > 0) {
    const d = Math.max(radius/2, 2500);
    const step = 360 / peripheralCount;
    for(let i=0;i<peripheralCount;i++){
      const b = i*step;
      const pt = destinationPoint(centerLatLng.lat(), centerLatLng.lng(), b, d);
      centers.push({ lat: pt.lat, lng: pt.lng, label: `b${Math.round(b)}` });
    }
  }

  const cacheKey = makeCacheKey(centerLatLng.lat(), centerLatLng.lng(), radius, PLACE_TYPES, peripheralCount);
  const cached = loadCache(cacheKey);
  if(cached) {
    setStatus('Loaded results from cache');
    renderPlacesOnMapAndList(cached, centerLatLng);
    return cached;
  }

  setStatus('Running nearby searches (this may take a few seconds)...');
  clearMarkers();
  const placesMap = new Map();

  const service = new google.maps.places.PlacesService(map);

  for(let ci = 0; ci < centers.length; ci++) {
    const c = centers[ci];
    for(let t = 0; t < PLACE_TYPES.length; t++) {
      const type = PLACE_TYPES[t];
      // per-search radius heuristic (overlapping coverage)
      const perSearchRadius = Math.min(radius, Math.max(2500, Math.floor(radius/2)));
      const req = {
        location: new google.maps.LatLng(c.lat, c.lng),
        radius: perSearchRadius,
        type: type
      };

      try {
        const results = await nearbySearchAllPages(service, req);
        for(const r of results) {
          if(!r.place_id) continue;
          // Filter by business_status: by default only OPERATIONAL, unless includeTempClosed true
          const bs = r.business_status || 'UNKNOWN';
          if(bs === 'CLOSED_PERMANENTLY') continue;
          if(bs === 'CLOSED_TEMPORARILY' && !includeTempClosed) continue;
          if(!placesMap.has(r.place_id)) placesMap.set(r.place_id, r);
        }
        await sleep(300);
      } catch(err) {
        console.warn('Search error', err);
        setStatus('Warning: some searches failed (see console).');
        await sleep(500);
      }
    }
  }

  const uniquePlaces = Array.from(placesMap.values());
  saveCache(cacheKey, uniquePlaces);
  setStatus('Completed. Results cached for 30 days.');
  renderPlacesOnMapAndList(uniquePlaces, centerLatLng);
  return uniquePlaces;
}

function renderPlacesOnMapAndList(places, centerLatLng) {
  clearMarkers();
  new google.maps.Marker({
    position: centerLatLng,
    map,
    title: 'Search center',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: '#1976d2',
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2
    }
  });
  places.forEach(p => addMarker(p, map));
  showResultsList(places);
  const bounds = new google.maps.LatLngBounds();
  bounds.extend(centerLatLng);
  places.forEach(p => { if(p.geometry && p.geometry.location) bounds.extend(p.geometry.location); });
  map.fitBounds(bounds);
}

function initApp() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 48.8566, lng: 2.3522 },
    zoom: 12,
  });

  const useLocationBtn = document.getElementById('use-location');
  const searchAddressBtn = document.getElementById('search-address');
  const startSearchBtn = document.getElementById('start-search');
  const addressInput = document.getElementById('address');
  const includeTempClosedCheckbox = document.getElementById('includeTempClosed');

  let lastCenterLatLng = map.getCenter();

  useLocationBtn.addEventListener('click', () => {
    setStatus('Requesting geolocation...');
    if(!navigator.geolocation) {
      setStatus('Geolocation not supported by browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      lastCenterLatLng = new google.maps.LatLng(lat, lng);
      map.setCenter(lastCenterLatLng);
      setStatus('Got location. Click "Start search" to run.');
    }, (err) => {
      setStatus('Geolocation error: ' + err.message);
    });
  });

  searchAddressBtn.addEventListener('click', () => {
    const addr = addressInput.value.trim();
    if(!addr) { setStatus('Enter an address first.'); return; }
    setStatus('Geocoding address...');
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: addr }, (results, status) => {
      if(status === 'OK' && results && results[0]) {
        lastCenterLatLng = results[0].geometry.location;
        map.setCenter(lastCenterLatLng);
        setStatus('Address located. Click "Start search" to run.');
      } else {
        setStatus('Geocode failed: ' + status);
      }
    });
  });

  startSearchBtn.addEventListener('click', async () => {
    const radius = parseInt(document.getElementById('radiusSelect').value, 10);
    const density = parseInt(document.getElementById('pointDensity').value, 10);
    const includeTemp = includeTempClosedCheckbox.checked;
    setStatus('Starting searches...');
    await searchAround(lastCenterLatLng, radius, density, includeTemp);
  });
}

window.addEventListener('load', initApp);
