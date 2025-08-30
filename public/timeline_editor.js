

    // Function to initialize the mini-map in the sidebar
    function initializeMiniMap() {
        if (miniMap) {
            miniMap.remove();
            miniMap = null;
        }

        miniMap = L.map('mini-map', {
            zoomControl: false, // Hide zoom controls on mini-map
            attributionControl: false, // Hide attribution
            interactive: true // Enable interaction for clicking on MSAs
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
        }).addTo(miniMap);

        if (msaGeoJSON) {
            // Filter GeoJSON features to include only those within the bounding box
            const filteredGeoJSON = {
                type: "FeatureCollection",
                features: msaGeoJSON.features.filter(feature => {
                    if (feature.geometry && feature.geometry.coordinates) {
                        // For polygons, check if the bounds intersect the bounding box
                        const layerBounds = L.geoJson(feature).getBounds();
                        return boundingBox.intersects(layerBounds);
                    }
                        // Handle other geometry types if necessary
                    return false;
                })
            };

            allMsaLayer = L.geoJson(filteredGeoJSON, {
                style: function(feature) {
                    const msaName = feature.properties.NAME;
                    const isLoaded = timelineData.some(msa => msa.name === msaName);
                    return {
                        fillColor: isLoaded ? '#ff4500' : '#ffff00', // Orange for loaded, Yellow for missing
                        weight: isLoaded ? 2 : 1, // Thicker outline for loaded
                        opacity: 1,
                        color: isLoaded ? '#ff0000' : '#000000', // Red outline for loaded, Black for missing
                        dashArray: isLoaded ? '1' : '3', // Solid for loaded, dashed for missing
                        fillOpacity: isLoaded ? 0.7 : 0.3 // Different opacity
                    };
                },
                onEachFeature: function (feature, layer) {
                    const msaName = feature.properties.NAME;
                    const isLoaded = timelineData.some(msa => msa.name === msaName);

                    if (isLoaded) {
                        // Add click listener to select the MSA
                        layer.on('click', function() {
                            const listItem = msaListElement.querySelector(`li[data-original-index="${timelineData.findIndex(item => item.name === msaName)}"]`);
                            if (listItem) {
                                listItem.click(); // Simulate click on the list item
                            } else {
                                console.warn(`MSA "${msaName}" not found in timelineData.`);
                            }
                        });
                    } else {
                        // Add click listener to select the missing MSA in the dropdown
                        layer.on('click', function() {
                            missingMsaSelect.value = msaName;
                            // Optionally, trigger the add button click
                            // addMissingMsaButton.click();
                        });
                    }
                }
            }).addTo(miniMap);

            // Fit the mini-map to the bounding box
            miniMap.fitBounds(boundingBox);
        }
    }

    // Function to initialize or update the map for the selected MSA in the editor area
    function initializeSelectedMsaMap(msaName) {
        if (!msaGeoJSON) {
            console.warn("MSA GeoJSON not loaded, cannot display selected MSA map.");
            return;
        }

        const msaFeature = msaGeoJSON.features.find(feature => feature.properties.NAME === msaName);

        if (!msaFeature) {
            console.warn(`GeoJSON feature not found for MSA: ${msaName}. Selected MSA map will not display.`);
            // Clear map container if feature not found
            if (selectedMsaMap) {
                selectedMsaMap.remove();
                selectedMsaMap = null;
            }
            document.getElementById('selected-msa-map').innerHTML = ''; // Clear map container
            return;
        }

        if (!selectedMsaMap) {
            // Initialize the map if it doesn't exist
            selectedMsaMap = L.map('selected-msa-map', {
                zoomControl: true, // Show zoom controls
                attributionControl: false, // Hide attribution
                interactive: false // Disable interaction
            });

            // Add a basic tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
            }).addTo(selectedMsaMap);
        } else {
            // Clear previous layer if map exists
            if (selectedMsaLayer) {
                selectedMsaMap.removeLayer(selectedMsaLayer);
            }
        }

        // Add the selected MSA polygon to the map
        selectedMsaLayer = L.geoJson(msaFeature, {
                style: {
                    fillColor: '#ff4500', // Highlight color
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                }
        }).addTo(selectedMsaMap);

        // Fit the map to the bounds of the selected polygon
        selectedMsaMap.fitBounds(selectedMsaLayer.getBounds());
    }


    // Function to populate the MSA list (with optional filtering)
    function populateMsaList(filterText = '') {
        msaListElement.innerHTML = ''; // Clear existing list
        const filteredData = timelineData.filter(msa =>
            msa.name.toLowerCase().includes(filterText.toLowerCase())
        );
        // Sort filtered data alphabetically by name
        filteredData.sort((a, b) => a.name.localeCompare(b.name));

        filteredData.forEach((msa, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = msa.name;
            // Store the original index in timelineData, not the filtered index
            listItem.dataset.originalIndex = timelineData.findIndex(item => item.name === msa.name);
            listItem.addEventListener('click', handleMsaSelect);
            msaListElement.appendChild(listItem);
        });
    }

    // Function to handle MSA selection from the list
    function handleMsaSelect(event) {
        // Remove selected class from previous item
        const selectedItem = msaListElement.querySelector('li.selected');
        if (selectedItem) {
            selectedItem.classList.remove('selected');
        }

        // Add selected class to the clicked item
        event.target.classList.add('selected');

        const msaIndex = parseInt(event.target.dataset.originalIndex); // Use originalIndex
        const selectedMsa = timelineData[msaIndex];

        editorArea.style.display = 'block'; // Show the editor area
        editorMsaName.textContent = `Editing: ${selectedMsa.name}`;
        renameMsaInput.value = selectedMsa.name; // Set rename input value
        renderTimelineEditor(selectedMsa.timeline);
        updateMiniMap(selectedMsa.name); // Highlight on mini-map
        initializeSelectedMsaMap(selectedMsa.name); // Initialize/update map for selected MSA
            validationErrorDiv.textContent = ''; // Clear previous validation errors
    }

    // Function to render the timeline editor content
        
        timelineEditorContent.innerHTML = ''; // Clear existing entries

        timeline.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('timeline-entry');
            entryDiv.dataset.index = index;

            let sectDropdownHtml = '<select class="entry-sect">';
            availableSects.forEach(sect => {
                sectDropdownHtml += `<option value="${sect}" ${entry.sect === sect ? 'selected' : ''}>${sect}</option>`;
            });
            sectDropdownHtml += '</select>';

            entryDiv.innerHTML = `
                Start: <input type="text" class="entry-start" value="${entry.start}" maxlength="4">
                End: <input type="text" class="entry-end" value="${entry.end}" maxlength="4">
                Sect: ${sectDropdownHtml}
                <br>
                Description: <textarea class="entry-description">${entry.description || ''}</textarea>
                <div class="timeline-entry-buttons">
                    <button class="remove-entry">Remove</button>
                    <button class="add-below-button">Add Below</button>
                </div>
            `;

            entryDiv.querySelector('.remove-entry').addEventListener('click', handleRemoveEntry);
            entryDiv.querySelector('.add-below-button').addEventListener('click', handleAddEntryBelow); // Add listener for Add Below

            // Add input and change listeners to all relevant fields
            entryDiv.querySelectorAll('input[type="text"], textarea, select').forEach(input => {
                    input.addEventListener('input', handleEntryInput);
                    input.addEventListener('change', handleEntryChange);
            });

            // Add keydown listener to date text fields to prevent backspace navigation
            entryDiv.querySelectorAll('.entry-start, .entry-end').forEach(input => {
                    input.addEventListener('keydown', function(event) {
                        if (event.key === 'Backspace') {
                            event.stopPropagation();
                        }
                    });
            });

            timelineEditorContent.appendChild(entryDiv);
        });
    }

        // Function to handle input events (for text fields and textareas)
        function handleEntryInput(event) {
            const entryDiv = event.target.closest('.timeline-entry');
            const entryIndex = parseInt(entryDiv.dataset.index);
            const selectedMsaIndex = parseInt(msaListElement.querySelector('li.selected').dataset.originalIndex); // Use originalIndex
            const selectedMsa = timelineData[selectedMsaIndex];

            const inputElement = event.target;
            const className = inputElement.classList[0]; // Get the class like 'entry-start', 'entry-end', 'entry-sect', or 'entry-description'
            let newValue = inputElement.value;

            // For date fields, attempt to parse as integer, but store as string if invalid for user to correct
            if (className === 'entry-start' || className === 'entry-end') {
                const parsedValue = parseInt(inputElement.value);
                newValue = isNaN(parsedValue) ? inputElement.value : parsedValue;
            }

            // Update the current entry's value directly
            selectedMsa.timeline[entryIndex][className.replace('entry-', '')] = newValue;

            // No re-rendering or sorting on every input for text fields/textareas
            // Validation will happen on export
        }


    // Function to handle changes in timeline entry inputs (fallback/for textareas and when input fields loses focus)
    function handleEntryChange(event) {
            const entryDiv = event.target.closest('.timeline-entry');
            const entryIndex = parseInt(entryDiv.dataset.index); // Parse index as integer
            const selectedMsaIndex = parseInt(msaListElement.querySelector('li.selected').dataset.originalIndex); // Use originalIndex
            const selectedMsa = timelineData[selectedMsaIndex];

            const inputElement = event.target;
            const className = inputElement.classList[0];

            let newValue = inputElement.value;

            // For date fields, attempt to parse as integer, but store as string if invalid for user to correct
            if (className === 'entry-start' || className === 'entry-end') {
                const parsedValue = parseInt(inputElement.value);
                newValue = isNaN(parsedValue) ? inputElement.value : parsedValue;
            }

            selectedMsa.timeline[entryIndex][className.replace('entry-', '')] = newValue;

            // Re-sort and re-render after changes that might affect order (like date changes)
            // This is done here because 'change' event fires after input loses focus or for textarea changes
            selectedMsa.timeline.sort((a, b) => a.start - b.start);
            renderTimelineEditor(selectedMsa.timeline); // Re-render to reflect sorting and update data-indices
    }


    // Function to handle removing a timeline entry
    function handleRemoveEntry(event) {
        const entryDiv = event.target.closest('.timeline-entry');
        const entryIndex = parseInt(entryDiv.dataset.index); // Parse index as integer
        const selectedMsaIndex = parseInt(msaListElement.querySelector('li.selected').dataset.originalIndex); // Use originalIndex
        const selectedMsa = timelineData[selectedMsaIndex];

        selectedMsa.timeline.splice(entryIndex, 1); // Remove the entry
        renderTimelineEditor(selectedMsa.timeline); // Re-render the editor
            // renderTimelineEditor also updates originalTimelineState and data-indices
    }

    // Function to handle adding a new timeline entry
    function handleAddTimelineEntry() {
        const selectedItem = msaListElement.querySelector('li.selected');
        if (!selectedItem) {
            alert("Please select an MSA to add a timeline entry.");
            return;
        }
        const selectedMsaIndex = parseInt(selectedItem.dataset.originalIndex); // Use originalIndex
        const selectedMsa = timelineData[selectedMsaIndex];

        // Add a default new entry at the end
        selectedMsa.timeline.push({
            start: 2025,
            end: 2025,
            sect: "Unknown",
            description: ""
        });

        // Re-sort and re-render
        selectedMsa.timeline.sort((a, b) => a.start - b.start);
        renderTimelineEditor(selectedMsa.timeline);
            // renderTimelineEditor also updates originalTimelineState and data-indices
    }

    // Function to handle adding a new timeline entry below an existing one
    function handleAddEntryBelow(event) {
        const entryDiv = event.target.closest('.timeline-entry');
        const entryIndex = parseInt(entryDiv.dataset.index); // Index of the entry below which to add
        const selectedMsaIndex = parseInt(msaListElement.querySelector('li.selected').dataset.originalIndex); // Use originalIndex
        const selectedMsa = timelineData[selectedMsaIndex];

        // Create a default new entry
        const newEntry = {
            start: selectedMsa.timeline[entryIndex].end, // Start after the current entry ends
            end: selectedMsa.timeline[entryIndex].end + 1, // Default end to one year later
            sect: "Unknown",
            description: ""
        };

        // Insert the new entry after the current one
        selectedMsa.timeline.splice(entryIndex + 1, 0, newEntry);

        // Re-sort and re-render
        selectedMsa.timeline.sort((a, b) => a.start - b.start);
        renderTimelineEditor(selectedMsa.timeline);
            // renderTimelineEditor also updates originalTimelineState and data-indices
    }


    // Function to handle adding a new MSA manually
    function handleAddMsa() {
        const newMsaName = prompt("Enter the name for the new MSA:");
        if (newMsaName && newMsaName.trim() !== "") {
            const trimmedName = newMsaName.trim();
            // Check if an MSA with this name already exists
            if (timelineData.some(msa => msa.name === trimmedName)) {
                alert(`An MSA with the name "${trimmedName}" already exists.`);
                return;
            }

            const newMsa = {
                name: trimmedName,
                timeline: [
                    { start: 1495, end: 2025, sect: "Unknown", description: "Initial Unknown period." }
                ]
            };
            timelineData.push(newMsa);
            populateMsaList(msaSearchInput.value); // Re-populate the list, applying current filter
                // Select the newly added MSA (find its new index after sorting)
            const newIndex = timelineData.findIndex(msa => msa.name === trimmedName);
            if (newIndex !== -1) {
                const newItem = msaListElement.querySelector(`li[data-original-index="${newIndex}"]`); // Use originalIndex
                if (newItem) {
                    newItem.click(); // Simulate click to select and open editor
                }
            }
        }
    }

        // Function to handle adding a missing MSA from the dropdown
        function handleAddMissingMsa() {
            const selectedMsaName = missingMsaSelect.value;
            if (selectedMsaName && selectedMsaName !== "") {
                // Check if an MSA with this name already exists in timelineData
                if (timelineData.some(msa => msa.name === selectedMsaName)) {
                    alert(`An MSA with the name "${selectedMsaName}" already exists in your timeline data.`);
                    return;
                }

                // Find the GeoJSON feature for the selected MSA to get its coordinates
                const msaFeature = msaGeoJSON.features.find(feature => feature.properties.NAME === selectedMsaName);

                const newMsa = {
                    name: selectedMsaName,
                    timeline: [
                        { start: 1495, end: 2025, sect: "Unknown", description: "Initial Unknown period." }
                    ]
                    // Optionally add coords if it's a point and you want to store it
                    // coords: msaFeature && msaFeature.geometry.type === 'Point' ? msaFeature.geometry.coordinates.reverse() : undefined // GeoJSON is [lon, lat], Leaflet is [lat, lon]
                };

                timelineData.push(newMsa);
                populateMsaList(msaSearchInput.value); // Re-populate the list
                populateMissingMsasDropdown(); // Update the missing MSAs dropdown
                populateCloneSourceDropdown(); // Update the clone source dropdown
                // Select the newly added MSA
                const newIndex = timelineData.findIndex(msa => msa.name === selectedMsaName);
                if (newIndex !== -1) {
                    const newItem = msaListElement.querySelector(`li[data-original-index="${newIndex}"]`);
                    if (newItem) {
                        newItem.click(); // Simulate click to select and open editor
                    }
                }
            } else {
                alert("Please select an MSA to add.");
            }
        }


    // Function to handle removing the selected MSA
    function handleRemoveMsa() {
        const selectedItem = msaListElement.querySelector('li.selected');
        if (selectedItem) {
            const msaIndex = parseInt(selectedItem.dataset.originalIndex); // Use originalIndex
            const msaName = timelineData[msaIndex].name;
            if (confirm(`Are you sure you want to remove the MSA "${msaName}"?`)) {
                timelineData.splice(msaIndex, 1); // Remove the MSA
                populateMsaList(msaSearchInput.value); // Re-populate the list, applying current filter
                populateMissingMsasDropdown(); // Update the missing MSAs dropdown
                populateCloneSourceDropdown(); // Update the clone source dropdown
                editorArea.style.display = 'none'; // Hide editor area
                    if (miniMap) { // Remove mini-map if it exists
                        miniMap.remove();
                        miniMap = null;
                    }
                    document.getElementById('mini-map').innerHTML = ''; // Clear map container
                    if (selectedMsaMap) { // Remove selected MSA map if it exists
                        selectedMsaMap.remove();
                        selectedMsaMap = null;
                    }
                    document.getElementById('selected-msa-map').innerHTML = ''; // Clear map container
                    validationErrorDiv.textContent = ''; // Clear any validation errors
            }
        } else {
            alert("Please select an MSA to remove.");
        }
    }

    // Function to handle renaming the selected MSA
    function handleRenameMsa() {
        const selectedItem = msaListElement.querySelector('li.selected');
        if (selectedItem) {
            const msaIndex = parseInt(selectedItem.dataset.originalIndex); // Use originalIndex
            const oldName = timelineData[msaIndex].name;
            const newName = renameMsaInput.value.trim();

            if (newName === "" || newName === oldName) {
                alert("Please enter a new name for the MSA.");
                return;
            }

                // Check if an MSA with the new name already exists (excluding the current one)
                if (timelineData.some((msa, index) => index !== msaIndex && msa.name === newName)) {
                    alert(`An MSA with the name "${newName}" already exists.`);
                    return;
                }


            timelineData[msaIndex].name = newName; // Update the name
            populateMsaList(msaSearchInput.value); // Re-populate the list to reflect the name change and sorting
                populateMissingMsasDropdown(); // Update the missing MSAs dropdown
                populateCloneSourceDropdown(); // Update the clone source dropdown
                // Re-select the renamed item (find it by the new name)
                const newIndex = timelineData.findIndex(msa => msa.name === newName);
                if (newIndex !== -1) {
                    const newItem = msaListElement.querySelector(`li[data-original-index="${newIndex}"]`); // Use originalIndex
                    if (newItem) {
                        newItem.click(); // Simulate click to select and update editor/mini-map
                    }
                }

        } else {
            alert("Please select an MSA to rename.");
        }
    }

    // Function to handle filtering the MSA list
    function handleMsaSearchInput() {
        populateMsaList(msaSearchInput.value);
    }

        // Function to handle applying bulk date shift
        function handleApplyBulkShift() {
            const selectedItem = msaListElement.querySelector('li.selected');
            if (selectedItem) {
                const msaIndex = parseInt(selectedItem.dataset.originalIndex); // Use originalIndex
                const selectedMsa = timelineData[msaIndex];
                const yearsToShift = parseInt(bulkShiftYearsInput.value);

                if (isNaN(yearsToShift) || yearsToShift === 0) {
                    alert("Please enter a valid number of years to shift.");
                    return;
                }

                if (confirm(`Are you sure you want to shift all dates for ${selectedMsa.name} by ${yearsToShift} years?`)) {
                    selectedMsa.timeline.forEach(entry => {
                        entry.start += yearsToShift;
                        entry.end += yearsToShift;
                    });

                    // Re-sort and re-render the timeline editor
                    selectedMsa.timeline.sort((a, b) => a.start - b.start);
                    renderTimelineEditor(selectedMsa.timeline);
                        validationErrorDiv.textContent = ''; // Clear previous validation errors
                }
            } else {
                alert("Please select an MSA to apply bulk editing.");
            }
        }

    // Function to handle cloning the timeline of the selected MSA
    function handleCloneTimeline() {
        const selectedItem = msaListElement.querySelector('li.selected');
        if (!selectedItem) {
            alert("Please select an MSA to clone its timeline to.");
            return;
        }
        const targetMsaIndex = parseInt(selectedItem.dataset.originalIndex); // Use originalIndex for target
        const targetMsa = timelineData[targetMsaIndex];

        // Find the source MSA from the clone source dropdown
        const sourceMsaName = cloneSourceSelect.value;
        if (!sourceMsaName) {
            alert("Please select an MSA to clone from.");
            return;
        }
        const sourceMsa = timelineData.find(msa => msa.name === sourceMsaName);
        if (!sourceMsa) {
                console.error(`Source MSA "${sourceMsaName}" not found in timeline data.`);
                alert(`Error: Source MSA "${sourceMsaName}" not found.`);
                return;
        }

        // Deep clone the timeline data from the source MSA
        const clonedTimeline = JSON.parse(JSON.stringify(sourceMsa.timeline));

        // Assign the cloned timeline to the target MSA
        targetMsa.timeline = clonedTimeline;

        // If the source MSA was a point, copy its coords and isPoint flag to the target
        if (sourceMsa.isPoint) {
            targetMsa.isPoint = true;
            targetMsa.coords = sourceMsa.coords;
        } else {
                // If the source was not a point, ensure the target is not marked as a point
                delete targetMsa.isPoint;
                delete targetMsa.coords;
        }


        // Re-render the timeline editor for the target MSA
        renderTimelineEditor(targetMsa.timeline);
            validationErrorDiv.textContent = ''; // Clear previous validation errors
    }


    // Function to validate the timeline data for overlaps
    function validateTimelineData(data) {
        const errors = [];
        data.forEach(msa => {
            // Sort timeline entries by start year to simplify overlap checking
            const sortedTimeline = msa.timeline.slice().sort((a, b) => a.start - b.start);

            for (let i = 0; i < sortedTimeline.length - 1; i++) {
                const current = sortedTimeline[i];
                const next = sortedTimeline[i + 1];

                // Check for overlap: if the current period's end is strictly greater than the next period's start
                if (current.end > next.start) {
                    errors.push(`Overlap in ${msa.name}: Entry ${i + 1} (Start: ${current.start}, End: ${current.end}) overlaps with Entry ${i + 2} (Start: ${next.start}, End: ${next.end})`);
                }
            }
                // Also check if end year is before start year
                sortedTimeline.forEach((entry, index) => {
                    if (entry.start > entry.end) {
                        errors.push(`Invalid dates in ${msa.name}: Entry ${index + 1} has start year (${entry.start}) after end year (${entry.end})`);
                    }
                });
        });
        return errors;
    }


    // Function to initialize or update the mini-map
    function updateMiniMap(msaName) {
        if (!msaGeoJSON) {
            console.warn("MSA GeoJSON not loaded, cannot display mini-map.");
            return;
        }

        // The mini-map now shows all MSAs, only highlight the selected one
        if (allMsaLayer) {
                allMsaLayer.eachLayer(layer => {
                    if (layer.feature.properties.NAME === msaName) {
                        layer.setStyle({ fillColor: '#ff4500', fillOpacity: 0.7 }); // Highlight color
                    } else {
                        layer.setStyle({ fillColor: '#ffff00', fillOpacity: 0.3 }); // Default color (Yellow)
                    }
                });
            }
    }

    // Function to export the current timeline data as a JSON file
    function exportJsonData() {
        const validationErrors = validateTimelineData(timelineData);

        if (validationErrors.length > 0) {
            validationErrorDiv.innerHTML = 'Validation Errors:<br>' + validationErrors.join('<br>');
            return; // Prevent export if there are errors
        } else {
            validationErrorDiv.textContent = ''; // Clear previous errors
        }

        saveTimelineDataToFirestore(timelineData);
    }

        // Function to get a list of MSAs in GeoJSON but not in timelineData
        function getMissingMsas() {
            if (!msaGeoJSON) return [];

            const timelineMsaNames = new Set(timelineData.map(msa => msa.name));
            const geoJsonMsaNames = msaGeoJSON.features
                .filter(feature => feature.properties && feature.properties.NAME) // Ensure properties and NAME exist
                .map(feature => feature.properties.NAME);

            const missingMsas = geoJsonMsaNames.filter(name => !timelineMsaNames.has(name));

            // Sort missing MSAs alphabetically
            missingMsas.sort();

            return missingMsas;
        }

        // Function to populate the missing MSAs dropdown
        function populateMissingMsasDropdown() {
            missingMsaSelect.innerHTML = '<option value="">Select an MSA</option>'; // Clear and add default option
            const missingMsas = getMissingMsas();
            missingMsas.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                missingMsaSelect.appendChild(option);
            });
        }

        // Function to populate the clone source dropdown
        function populateCloneSourceDropdown() {
            cloneSourceSelect.innerHTML = '<option value="">Select MSA to Clone From</option>'; // Clear and add default option
            // Populate with names of MSAs currently in timelineData
            timelineData.forEach(msa => {
                const option = document.createElement('option');
                option.value = msa.name;
                option.textContent = msa.name;
                cloneSourceSelect.appendChild(option);
            });
        }


    function showSnackbar(message) {
        const snackbar = document.getElementById('snackbar');
        snackbar.textContent = message;
        snackbar.className = 'show';
        setTimeout(function(){ snackbar.className = snackbar.className.replace('show', ''); }, 3000);
    }

    // Event listener for the Add Timeline Entry button
    addTimelineEntryButton.addEventListener('click', handleAddTimelineEntry);

    // Event listener for the Export JSON button
    exportJsonButton.addEventListener('click', exportJsonData);

    // Event listeners for the new MSA management buttons
    addMsaButton.addEventListener('click', handleAddMsa);
    removeMsaButton.addEventListener('click', handleRemoveMsa);
    renameMsaButton.addEventListener('click', handleRenameMsa);
        addMissingMsaButton.addEventListener('click', handleAddMissingMsa); // Listener for adding missing MSA
    cloneTimelineButton.addEventListener('click', handleCloneTimeline); // Listener for cloning timeline


    // Event listener for the MSA search input
    msaSearchInput.addEventListener('input', handleMsaSearchInput);

    // Event listener for the Apply Bulk Shift button
    applyBulkShiftButton.addEventListener('click', handleApplyBulkShift);


    fetch('https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/20m/2017/metropolitan-statistical-area!micropolitan-statistical-area.json')
        .then(response => response.json())
        .then(data => {
            msaGeoJSON = data;
            console.log("MSA GeoJSON loaded for mini-map.");
            loadTimelineDataFromFirestore((data) => {
                timelineData = data;
                console.log("Timeline data loaded successfully from Firestore.");
                populateMsaList(); // Populate the list after loading data
                populateMissingMsasDropdown(); // Populate missing MSAs dropdown
                populateCloneSourceDropdown(); // Populate clone source dropdown
                editorArea.style.display = 'none'; // Hide editor until an MSA is selected
                if (miniMap) { // Remove mini-map if it exists
                    miniMap.remove();
                    miniMap = null;
                }
                document.getElementById('mini-map').innerHTML = ''; // Clear map container
                if (selectedMsaMap) { // Remove selected MSA map if it exists
                    selectedMsaMap.remove();
                    selectedMsaMap = null;
                }
                document.getElementById('selected-msa-map').innerHTML = ''; // Clear map container
                validationErrorDiv.textContent = ''; // Clear previous validation errors
                initializeMiniMap(); // Re-initialize mini-map with all MSAs
            }, () => {
                showSnackbar("Could not load timeline data from the database.");
            });
        })
        .catch(error => {
            console.error('Error loading MSA GeoJSON:', error);
            showSnackbar("Error loading map data. Please try again later.");
        });

    saveChangesButton.addEventListener('click', function() {
        const validationErrors = validateTimelineData(timelineData);

        if (validationErrors.length > 0) {
            validationErrorDiv.innerHTML = 'Validation Errors:<br>' + validationErrors.join('<br>');
            return; // Prevent export if there are errors
        } else {
            validationErrorDiv.textContent = ''; // Clear previous errors
        }

        saveTimelineDataToFirestore(timelineData, () => {
            showSnackbar("Timeline data saved successfully!");
        }, () => {
            showSnackbar("Error saving timeline data.");
        });
    });

    // Initial population of the MSA list (assuming timelineData is initially empty or loaded from somewhere)
    populateMsaList();
    populateMissingMsasDropdown(); // Populate missing MSAs dropdown
    populateCloneSourceDropdown(); // Populate clone source dropdown
    editorArea.style.display = 'none'; // Hide editor initially
    validationErrorDiv.textContent = ''; // Clear validation errors initially
});
