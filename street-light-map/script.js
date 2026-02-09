function initMap() {
  fetch("street-lights.json")
    .then(response => response.json())
    .then(streetLights => {
      
      // --- 1. CORE MAP & APP INITIALIZATION ---
      const mapCenter = { lat: 2.3, lng: 102.3 };
      const streetViewService = new google.maps.StreetViewService();
      const infoWindow = new google.maps.InfoWindow();
      
      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 11,
        center: mapCenter,
        mapId: "MAP ID"
      });

      // --- 2. STATE VARIABLES ---
      const allMarkers = [];
      const allListItems = [];
      let searchedLocationMarker = null;

      // --- 3. DOM ELEMENT SELECTORS ---
      const listElement = document.getElementById("street-light-list");
      const filterSearchInput = document.getElementById("search-box");
      const globalSearchInput = document.getElementById("global-search-box");
      const findMeBtn = document.getElementById("find-me-btn");

// --- 4. TARGETED PLACE SEARCH (MELAKA ONLY) ---
const melakaBounds = {
  north: 2.50, // Approximate Melaka northern boundary
  south: 2.05, // Approximate Melaka southern boundary
  west: 101.9, // Approximate Melaka western boundary
  east: 102.6  // Approximate Melaka eastern boundary
};

const autocomplete = new google.maps.places.Autocomplete(globalSearchInput, {
  bounds: melakaBounds,
  componentRestrictions: { country: "my" }, // Restrict to Malaysia
  fields: ["geometry", "name"], // Only request necessary data to save on API costs
  strictBounds: true // Set to true to ONLY show results inside the Melaka box
});

autocomplete.bindTo("bounds", map);

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(17);
        }

        if (searchedLocationMarker) searchedLocationMarker.map = null;
        searchedLocationMarker = new google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: place.geometry.location,
          title: place.name
        });
      });

      // --- 5. FILTERING LOGIC ---
      function applyFilters() {
        const searchTerm = filterSearchInput.value.toLowerCase().replace(/\s/g, '');
        const selectedLamps = Array.from(document.querySelectorAll('#filter-options-wrapper input:checked')).map(cb => cb.value);
        const activeCapFilters = Array.from(document.querySelectorAll('.cap-filter:checked')).map(cb => cb.getAttribute('data-prop'));

        allMarkers.forEach((marker, index) => {
          const listItem = allListItems[index];
          const itemText = listItem.textContent.toLowerCase().replace(/\s/g, '');

          const lampMatch = !selectedLamps.length || selectedLamps.includes(marker.lampType);
          const searchMatch = itemText.includes(searchTerm);
          const capMatch = !activeCapFilters.length || activeCapFilters.some(prop => Number(marker[prop]) > 0);

          if (lampMatch && searchMatch && capMatch) {
            marker.map = map;
            listItem.style.display = "";
          } else {
            marker.map = null;
            listItem.style.display = "none";
          }
        });
      }

      // --- 6. DATA PROCESSING ---
      streetLights.forEach(light => {
        const colors = { SON: "#125092ff", LED: "#800080", solarLED: "#bb6400", LEDNikkon: "#b00000" };
        const pin = new google.maps.marker.PinElement({ background: colors[light.lampType] || "#6c757d", borderColor: "#333", glyphColor: "#ffffff" });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: light.position,
          map: map,
          title: light.code,
          content: pin.element 
        });

        // Properties for filtering
        marker.lampType = light.lampType;
        marker["1ArmPole"] = light["1ArmPole"];
        marker["2ArmPole"] = light["2ArmPole"];
        marker["w120Solar"] = light["120wSolar"];
        marker["w80Solar"] = light["80wSolar"];
        marker["w120"] = light["120w"];
        marker["w150"] = light["150w"];
        marker["w170"] = light["170w"];
        marker["w180"] = light["180w"];
        marker["250w"] = light["250w"];
        marker["spotlight"] = light.spotlight;
        
        allMarkers.push(marker);
        const listItem = document.createElement("li");
        listItem.innerHTML = `<strong>${light.code}</strong>${light.lampType} Type`;
        listElement.appendChild(listItem);
        allListItems.push(listItem);

        // Marker Click (InfoWindow + Street View Check)
        marker.addListener("click", () => {
          streetViewService.getPanorama({ location: light.position, radius: 50 }, (data, status) => {
            const container = document.createElement("div");
            container.style.minWidth = "240px";
            container.style.maxWidth = "260px";

            container.innerHTML = `
              <div style="font-family: 'Inter', sans-serif;">
                <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #125092ff;">${light.code}</h3>
                <p style="margin: 5px 0; font-size: 13px;"><strong>Feeder Pillar:</strong> ${light.description}</p>
                <p style="margin: 5px 0; font-size: 13px;"><strong>Lamp Type:</strong> ${light.lampType}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px;">
                  <div><strong>Solar 120W:</strong> ${light["120wSolar"]}</div>
                  <div><strong>Solar 80W:</strong> ${light["80wSolar"]}</div>
                  <div><strong>120W:</strong> ${light["120w"]}</div>
                  <div><strong>150W:</strong> ${light["150w"]}</div>
                  <div><strong>170W:</strong> ${light["170w"]}</div>
                  <div><strong>180W:</strong> ${light["180w"]}</div>
                  <div><strong>250W:</strong> ${light["250w"]}</div>
                  <div><strong>Spotlight:</strong> ${light.spotlight}</div>
                </div>
                <div style="margin-top: 10px;">
                  <a href="https://www.google.com/maps/place/${light.position.lat},${light.position.lng}" target="_blank" style="color: #007bff; text-decoration: none; ">View on Google Maps</a>
                </div>
              </div>`;

            if (status === google.maps.StreetViewStatus.OK) {
              const panoDiv = document.createElement("div");
              panoDiv.style.width = "100%"; panoDiv.style.height = "150px"; panoDiv.style.marginTop = "10px"; panoDiv.style.borderRadius = "6px";
              container.appendChild(panoDiv);
              infoWindow.setContent(container); infoWindow.open(map, marker);
              new google.maps.StreetViewPanorama(panoDiv, { pano: data.location.pano, visible: true, controls: false });
            } else {
              infoWindow.setContent(container); infoWindow.open(map, marker);
            }
          });
          allListItems.forEach(item => item.classList.remove("active-list-item"));
          listItem.classList.add("active-list-item");
          listItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        listItem.addEventListener("click", () => {
          map.panTo(light.position);
          google.maps.event.trigger(marker, "click");
        });
      });

      // --- 7. BUTTON EVENT LISTENERS ---
      filterSearchInput.addEventListener("keyup", applyFilters);
      document.querySelectorAll('#sidebar input[type="checkbox"]').forEach(cb => cb.addEventListener("change", applyFilters));
      
      document.getElementById("clear-search-btn").addEventListener("click", () => {
        globalSearchInput.value = "";
        if (searchedLocationMarker) searchedLocationMarker.map = null;
      });

      document.getElementById("clear-filter-btn").addEventListener("click", () => {
        filterSearchInput.value = "";
        applyFilters();
      });

      findMeBtn.addEventListener("click", () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
            map.setCenter(pos); map.setZoom(15);
          });
        }
      });
    });
}