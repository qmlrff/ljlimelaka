function initMap() {
  // 1. Pointed to the correct JSON file
  fetch("traffic-lights.json")
    .then(response => response.json())
    .then(trafficLights => { // Renamed variable for clarity
      
      const mapCenter = { lat: 2.3, lng: 102.3 };
      const streetViewService = new google.maps.StreetViewService();
      const infoWindow = new google.maps.InfoWindow();
      
      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 11,
        center: mapCenter,
        mapId: "MAP ID"
      });

      const allMarkers = [];
      const allListItems = [];
      let searchedLocationMarker = null;

      // 2. Fixed ID to match HTML
      const listElement = document.getElementById("traffic-light-list");
      const filterSearchInput = document.getElementById("search-box");
      const globalSearchInput = document.getElementById("global-search-box");
      const findMeBtn = document.getElementById("find-me-btn");

      // --- PLACE SEARCH LOGIC ---
      const melakaBounds = { north: 2.50, south: 2.05, west: 101.9, east: 102.6 };
      const autocomplete = new google.maps.places.Autocomplete(globalSearchInput, {
        bounds: melakaBounds,
        componentRestrictions: { country: "my" },
        fields: ["geometry", "name"],
        strictBounds: true
      });
      autocomplete.bindTo("bounds", map);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;
        map.setCenter(place.geometry.location);
        map.setZoom(17);
        if (searchedLocationMarker) searchedLocationMarker.map = null;
        searchedLocationMarker = new google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: place.geometry.location,
          title: place.name
        });
      });

      // --- 3. REVISED FILTERING LOGIC ---
function applyFilters() {
    // 1. Get the current search term
    const searchTerm = document.getElementById("search-box").value.toLowerCase().replace(/\s/g, '');
    
    // 2. Get all checked category values into an array
    const selectedCategories = Array.from(document.querySelectorAll('.cat-filter:checked'))
                                    .map(cb => cb.value);
const selectedTypes = Array.from(document.querySelectorAll('.opt-filter:checked')).map(cb => cb.value);
    allMarkers.forEach((marker, index) => {
        const listItem = allListItems[index];
        const itemText = listItem.textContent.toLowerCase().replace(/\s/g, '');

        // 3. Logic: Match search AND (No categories selected OR category is in the selected list)
        const searchMatch = itemText.includes(searchTerm);
        const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(marker.category);
        const typeMatch = !selectedTypes.length || selectedTypes.includes(marker.intersectionType);

        if (searchMatch && categoryMatch && typeMatch) {
            marker.map = map;
            listItem.style.display = "";
        } else {
            marker.map = null;
            listItem.style.display = "none";
        }
    });
}

      // --- 4. DATA PROCESSING ---
      trafficLights.forEach(light => {
        // Skip invalid coordinates
        if (!light.position.lat || light.position.lat === 0) return;

        // Color markers based on Intersection Type to match Legend
        const colors = { "3 way": "#125092", "4 way": "#800080", "Pedestrian": "#bb6400"};
        const pin = new google.maps.marker.PinElement({ 
            background: colors[light.intersectionType] || "#6c757d", 
            borderColor: "#333", 
            glyphColor: "#ffffff" 
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: light.position,
          map: map,
          title: light.code,
          content: pin.element 
        });

        marker.category = light.category;
        marker.intersectionType = light.intersectionType;
        allMarkers.push(marker);

        const listItem = document.createElement("li");
        listItem.innerHTML = `<strong>${light.code}</strong>${light.description}`;
        listElement.appendChild(listItem);
        allListItems.push(listItem);

        marker.addListener("click", () => {
          streetViewService.getPanorama({ location: light.position, radius: 50 }, (data, status) => {
            const container = document.createElement("div");
            container.style.maxWidth = "240px";
            container.style.minWidth = "220px";
            
            // Fixed the Google Maps Link
            const mapsUrl = `https://www.google.com/maps?q=${light.position.lat},${light.position.lng}`;

            container.innerHTML = `
              <div style="font-family: 'Inter', sans-serif;">
                <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #125092;">${light.code}</h3>
                <p style="margin: 5px 0; font-size: 13px;"><strong>Description:</strong> ${light.description}</p>
                <p style="margin: 5px 0; font-size: 13px;"><strong>District:</strong> ${light.category}</p>
                <div style="font-size: 12px;"><strong>Type:</strong> ${light.intersectionType}</div>
                <div style="margin-top: 10px;">
                  <a href="${mapsUrl}" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">View on Google Maps</a>
                </div>
              </div>`;

            if (status === google.maps.StreetViewStatus.OK) {
              const panoDiv = document.createElement("div");
              panoDiv.style.width = "100%"; panoDiv.style.height = "120px"; panoDiv.style.marginTop = "10px"; panoDiv.style.borderRadius = "6px";
              container.appendChild(panoDiv);
              infoWindow.setContent(container); infoWindow.open(map, marker);
              new google.maps.StreetViewPanorama(panoDiv, { pano: data.location.pano, visible: true, controls: false });
            } else {
              infoWindow.setContent(container); infoWindow.open(map, marker);
            }
          });
          
          allListItems.forEach(item => item.classList.remove("active-list-item"));
          listItem.classList.add("active-list-item");
          listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        listItem.addEventListener("click", () => {
          map.panTo(light.position);
          google.maps.event.trigger(marker, "click");
        });
      });

      // --- 5. EVENT LISTENERS ---
      filterSearchInput.addEventListener("keyup", applyFilters);
      document.querySelectorAll('#sidebar input[type="checkbox"]').forEach(cb => cb.addEventListener("change", applyFilters));
      
      document.getElementById("clear-search-btn").addEventListener("click", () => {
        globalSearchInput.value = "";
        if (searchedLocationMarker) searchedLocationMarker.map = null;
      });

      document.getElementById("clear-filter-btn").addEventListener("click", () => {
        filterSearchInput.value = "";
        document.querySelectorAll('#sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
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