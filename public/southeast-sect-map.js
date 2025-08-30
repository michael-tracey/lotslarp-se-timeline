    // Define the strict bounds for the map (unchanged)
    const southWestBound = L.latLng(22.4970361396, -98.034689445);
    const northEastBound = L.latLng(40.0887528861, -69.9140855856);
    const strictBounds = L.latLngBounds(southWestBound, northEastBound);

    let initialZoom;

    const map = L.map('map', {
        maxBounds: strictBounds,
        maxBoundsViscosity: 1.0
    });

    // Fit the map to the strict bounds initially
    map.fitBounds(strictBounds);
    initialZoom = map.getZoom();

    map.setMinZoom(initialZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        noWrap: true
    }).addTo(map);

    

    let timelineData = [];
    let msaGeoJSON;

    let msaLayer;
    let pointLayer;
    let animationInterval;
    let isPlaying = false;
    let groupedChangePoints = [];
    let currentChangeGroupIndex = 0;
    let leafletLayers = {};
    let multiChangePopup = null;
    let changesDisplayDiv;
    let animationSpeed = 1;

    function getSectAtYear(territoryTimeline, year) {
        for (const period of territoryTimeline) {
            if (year >= period.start && year <= period.end) {
                return period.sect;
            }
        }
        return "Unknown";
    }

    function generatePopupContent(territoryName, currentYear, showFullHistory = true) {
        const territoryData = timelineData.find(t => t.name === territoryName);
        if (!territoryData) return `<b>${territoryName}</b><br>Data not available.`;

        const currentSect = getSectAtYear(territoryData.timeline, currentYear);
        let content = `<b>${territoryName}</b><br>Current Sect (${currentYear}): ${currentSect}`;

        if (showFullHistory) {
            content += `<br><br>Timeline:<ul>`;
            const historicalChanges = territoryData.timeline
                .slice()
                .sort((a, b) => a.start - b.start);

            historicalChanges.forEach(period => {
                content += `<li>Year ${period.start} - ${period.end}: ${period.description || "Control changes to " + period.sect}</li>`;
            });
            content += '</ul>';
        } else {
             const mostRecentChange = territoryData.timeline.slice().reverse().find(period => period.end < currentYear && period.start <= currentYear);
             if (mostRecentChange) {
                  content += "<br>" + (mostRecentChange.description || "Control changes to " + mostRecentChange.sect);
             } else {
                 const initialPeriod = territoryData.timeline.find(period => period.start <= currentYear && period.end >= currentYear);
                 if (initialPeriod && initialPeriod.start === currentYear) {
                     content += "<br>" + (initialPeriod.description || "Control starts as " + initialPeriod.sect);
                 }
             }
        }

        return content;
    }

    function stylePolygon(feature) {
        const msaName = feature.properties.NAME;
        const year = parseInt(document.getElementById('year-slider').value);

        const territoryData = timelineData.find(t => t.name === msaName);

        let sect = "Unknown";
        if (territoryData) {
            sect = getSectAtYear(territoryData.timeline, year);
        }

        return {
            fillColor: sectColors[sect] || sectColors["Unknown"],
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }

    function updateMap(year) {
        document.getElementById('current-year').innerText = year;
        document.getElementById('map-year-display').innerText = year;

        // Remove existing layers
        if (msaLayer) {
            map.removeLayer(msaLayer);
        }
        if (pointLayer) {
           map.removeLayer(pointLayer);
        }
        leafletLayers = {};

        let boundsToFit = null;

        // Add MSA polygon layer
        if (msaGeoJSON && timelineData.length > 0) {
             const filteredGeoJSON = {
                 type: "FeatureCollection",
                 features: msaGeoJSON.features.filter(feature =>
                     timelineData.some(t => t.name === feature.properties.NAME)
                 )
             };

            msaLayer = L.geoJson(filteredGeoJSON, {
                style: stylePolygon,
                onEachFeature: function (feature, layer) {
                    const msaName = feature.properties.NAME;
                    leafletLayers[msaName] = layer;

                    layer.on('click', function() {
                        if (isPlaying) {
                            pauseTimeline();
                        }
                        const currentYear = parseInt(document.getElementById('year-slider').value);
                        const popupContent = generatePopupContent(msaName, currentYear, true);
                        displayContentInChangesDiv("<h4>" + msaName + "</h4>" + popupContent);
                    });
                }
            }).addTo(map);

            if (msaLayer.getBounds().isValid()) {
                boundsToFit = msaLayer.getBounds();
            }
        }

        // Add point layer (points are added, but not used for fitting bounds)
        const points = timelineData.filter(t => t.isPoint);
        pointLayer = L.layerGroup().addTo(map); // Always initialize pointLayer

        if (points.length > 0) {
            points.forEach(point => {
                 const year = parseInt(document.getElementById('year-slider').value);
                 const sect = getSectAtYear(point.timeline, year);
                 const markerColor = sectColors[sect] || sectColors["Unknown"];

                 const circleMarker = L.circleMarker(point.coords, {
                     radius: 8,
                     fillColor: markerColor,
                     color: "#000",
                     weight: 1,
                     opacity: 1,
                     fillOpacity: 0.8
                 }).addTo(pointLayer);

                 leafletLayers[point.name] = circleMarker;

                 circleMarker.on('click', function() {
                      if (isPlaying) {
                          pauseTimeline();
                      }
                      const currentYear = parseInt(document.getElementById('year-slider').value);
                      const popupContent = generatePopupContent(point.name, currentYear, true);
                      displayContentInChangesDiv("<h4>" + point.name + "</h4>" + popupContent);
                 });
            });
        }

        // Fit map to bounds with error handling, only considering msaLayer bounds
        try {
            if (boundsToFit && boundsToFit.isValid()) {
                map.fitBounds(boundsToFit);
            } else {
                // Fallback to strict bounds if no valid MSA polygon bounds
                map.fitBounds(strictBounds);
            }
        } catch (error) {
            console.error("Error fitting map bounds:", error);
            // Fallback to strict bounds if fitting fails
            try {
                map.fitBounds(strictBounds);
            } catch (fallbackError) {
                console.error("Error fitting strict bounds as fallback:", fallbackError);
            }
        }
    }

    function playTimeline() {
        const slider = document.getElementById('year-slider');
        const playPauseButton = document.getElementById('play-pause-button');

        if (!isPlaying) {
            isPlaying = true;
            playPauseButton.innerText = 'Pause';
            if (parseInt(slider.value) === parseInt(slider.min)) {
                 currentChangeGroupIndex = 0;
            } else {
                 currentChangeGroupIndex = groupedChangePoints.findIndex(group => group.year >= parseInt(slider.value));
                 if (currentChangeGroupIndex === -1) {
                     currentChangeGroupIndex = 0;
                 }
            }

            processNextChangeGroup();
        }
    }

    function processNextChangeGroup() {
        hideMultiChangePopup();
        map.closePopup();
        clearChangesDisplayDiv();

        if (currentChangeGroupIndex < groupedChangePoints.length) {
            const changeGroup = groupedChangePoints[currentChangeGroupIndex];
            const slider = document.getElementById('year-slider');

            slider.value = changeGroup.year;
            updateMap(changeGroup.year);

            displayChangesInDiv(changeGroup);

            animationInterval = setTimeout(() => {
                currentChangeGroupIndex++;
                processNextChangeGroup();
            }, 1000 / animationSpeed);
        } else {
            pauseTimeline();
            currentChangeGroupIndex = 0;
        }
    }

    function pauseTimeline() {
        isPlaying = false;
        clearTimeout(animationInterval);
        document.getElementById('play-pause-button').innerText = 'Play';
        map.closePopup();
        hideMultiChangePopup();
        clearChangesDisplayDiv();
    }

    function generateGroupedChangePoints() {
        const changes = [];
        timelineData.forEach(territory => {
            territory.timeline.forEach(period => {
                 if (period.start >= 1495) {
                     changes.push({
                         year: period.start,
                         territoryName: territory.name,
                         sect: period.sect,
                         description: period.description,
                         isPoint: territory.isPoint,
                         coords: territory.coords
                     });
                 }
            });
        });

        changes.sort((a, b) => {
            if (a.year !== b.year) {
                return a.year - b.year;
            }
            return a.territoryName.localeCompare(b.territoryName);
        });

        const grouped = {};
        changes.forEach(change => {
            if (!grouped[change.year]) {
                grouped[change.year] = [];
            }
            grouped[change.year].push(change);
        });

        groupedChangePoints = Object.keys(grouped).sort((a, b) => a - b).map(year => ({
            year: parseInt(year),
            changes: grouped[year]
        }));

         const filteredGroupedChanges = [];
         let previousYearData = {};

         groupedChangePoints.forEach(changeGroup => {
             const changesInThisYear = [];
             changeGroup.changes.forEach(change => {
                 const territoryData = timelineData.find(t => t.name === change.territoryName);
                 if (territoryData) {
                     const previousPeriod = territoryData.timeline.slice().reverse().find(period => period.end < change.year);
                     const previousSect = previousPeriod ? previousPeriod.sect : "Unknown";

                     if (change.sect !== previousSect) {
                         changesInThisYear.push(change);
                     }
                 }
             });

             if (changesInThisYear.length > 0) {
                 filteredGroupedChanges.push({
                     year: changeGroup.year,
                     changes: changesInThisYear
                 });
             }

             changesInThisYear.forEach(change => {
                 previousYearData[change.territoryName] = change.sect;
             });
         });

         groupedChangePoints = filteredGroupedChanges;
    }

    function showMultiChangePopup(changeGroup) {
        hideMultiChangePopup();

        multiChangePopup = document.createElement('div');
        multiChangePopup.className = 'multi-change-popup';

        let content = "<h4>Year " + changeGroup.year + " Changes:</h4><ul>";
        changeGroup.changes.forEach(change => {
            content += "<li><b>" + change.territoryName + ":</b> " + (change.description || "Control changes to " + change.sect) + "</li>";
        });
        content += '</ul>';

        multiChangePopup.innerHTML = content;
        document.getElementById('map').appendChild(multiChangePopup);
    }

    function hideMultiChangePopup() {
        if (multiChangePopup) {
            multiChangePopup.remove();
            multiChangePopup = null;
        }
    }

    function displayChangesInDiv(changeGroup) {
        clearChangesDisplayDiv();

        let content = "<h4>Year " + changeGroup.year + " Changes:</h4><ul>";
        changeGroup.changes.forEach(change => {
            content += "<li><b>" + change.territoryName + ":</b> " + (change.description || "Control changes to " + change.sect) + "</li>";
        });
        content += '</ul>';

        changesDisplayDiv.innerHTML = content;
        changesDisplayDiv.style.display = 'block';
    }

     function displayContentInChangesDiv(contentHtml) {
        clearChangesDisplayDiv();
        changesDisplayDiv.innerHTML = contentHtml;
        changesDisplayDiv.style.display = 'block';
     }

    function clearChangesDisplayDiv() {
        if (changesDisplayDiv) {
            changesDisplayDiv.innerHTML = '';
            changesDisplayDiv.style.display = 'none';
        }
    }

    function showSnackbar(message) {
        const snackbar = document.getElementById('snackbar');
        snackbar.textContent = message;
        snackbar.className = 'show';
        setTimeout(function(){ snackbar.className = snackbar.className.replace('show', ''); }, 3000);
    }

    function loadTimelineDataFromFirestore() {
        const db = firebase.firestore();
        const docRef = db.collection("timelineData").doc("vampireTimeline");
        docRef.get().then((doc) => {
            if (doc.exists) {
                timelineData = doc.data().data;
                console.log("Timeline data loaded successfully from Firestore.");
                generateGroupedChangePoints();
                updateMap(parseInt(document.getElementById('year-slider').value));
            } else {
                console.log("No such document in Firestore!");
                showSnackbar("Could not load timeline data from the database.");
            }
        }).catch((error) => {
            console.log("Error getting document from Firestore:", error);
            showSnackbar("Error getting timeline data from the database.");
        });
    }

    

    map.on('move', () => {
        map.closePopup();
        hideMultiChangePopup();
        clearChangesDisplayDiv();
    });

    map.on('zoom', () => {
        map.closePopup();
        hideMultiChangePopup();
        clearChangesDisplayDiv();
    });

    fetch('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
        .then(() => {
             fetch('https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/20m/2017/metropolitan-statistical-area!micropolitan-statistical-area.json')
                .then(response => response.json())
                .then(data => {
                    msaGeoJSON = data;
                    console.log("MSA GeoJSON loaded.");
                    loadTimelineDataFromFirestore();
                })
                .catch(error => {
                    console.error('Error loading MSA GeoJSON:', error);
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255, 0, 0, 0.7); color: white; padding: 20px; border-radius: 10px; z-index: 1000;';
                    errorDiv.innerText = 'Error loading map data. Please try again later.';
                    document.getElementById('map').appendChild(errorDiv);
                });
        })
        .catch(error => {
             console.error('Error loading Leaflet:', error);
             const errorDiv = document.createElement('div');
             errorDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255, 0, 0, 0.7); color: white; padding: 20px; border-radius: 10px; z-index: 1000;';
             errorDiv.innerText = 'Error loading map library. Please try again later.';
             document.getElementById('map').appendChild(errorDiv);
        });

    document.addEventListener('DOMContentLoaded', function() {
        changesDisplayDiv = document.getElementById('changes-display');
        const advancedOptionsButton = document.getElementById('advanced-options-button');
        const advancedOptionsDiv = document.getElementById('advanced-options');
        const speedButtons = document.querySelectorAll('.speed-controls button');
        const timelineEditorButton = document.getElementById('timeline-editor-button');


        advancedOptionsButton.addEventListener('click', function() {
            const isHidden = advancedOptionsDiv.style.display === 'none' || advancedOptionsDiv.style.display === '';
            advancedOptionsDiv.style.display = isHidden ? 'flex' : 'none';
        });

        

        speedButtons.forEach(button => {
            button.addEventListener('click', function() {
                speedButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.remove('active'); // Remove active from previously active button
                this.classList.add('active'); // Add active to the clicked button
                animationSpeed = parseFloat(this.dataset.speed);
                if (!isPlaying) {
                    playTimeline();
                }
            });
        });

    });

    document.getElementById('year-slider').addEventListener('input', function() {
        if (isPlaying) {
            pauseTimeline();
        }

        const currentYear = parseInt(this.value);
        updateMap(currentYear);

        map.closePopup();
        hideMultiChangePopup();
        clearChangesDisplayDiv();

        const relevantChangeGroup = groupedChangePoints.slice().reverse().find(group => group.year <= currentYear);
        if (relevantChangeGroup) {
            displayChangesInDiv(relevantChangeGroup);
        }
    });

    document.getElementById('play-pause-button').addEventListener('click', function() {
        if (isPlaying) {
            pauseTimeline();
        } else {
            playTimeline();
        }
    });
