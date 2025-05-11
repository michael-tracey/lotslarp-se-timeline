# **LotsLarp Sect Timeline**

A web-based interactive map viewer and editor for visualizing the historical control of different vampire sects over Metropolitan Statistical Areas (MSAs) and key locations in the Southern and Eastern United States, based on the LotsLarp setting.

## **Features**

* Interactive map displaying sect control by year.  
* Timeline slider to navigate through history.  
* Play/Pause and adjustable speed controls for the timeline animation.  
* Click on an MSA or point to view its full historical timeline in the info panel.  
* Info panel to display timeline changes during animation and detailed history on click.  
* Advanced options for loading local timeline data and opening the timeline editor.  
* Timeline Editor (in a separate HTML file) for modifying the timeline data, adding/removing locations, and exporting changes.

## **Getting Started**

1. **Clone the repository:**  
   git clone \<repository\_url\>

   Replace \<repository\_url\> with the actual URL of your GitHub repository.  
2. **Navigate to the project directory:**  
   cd lotslarp-sect-timeline

3. Open the southeast-sect-map.html file:  
   Simply open the southeast-sect-map.html file in your web browser. You do not need a web server to run the basic viewer.

## **Usage**

### **Map Viewer (index2.html)**

* **Timeline Navigation:** Use the slider at the bottom of the map to manually change the year and see the map update.  
* **Play/Pause:** Click the "Play" button to start the timeline animation. Click it again to pause.  
* **Speed Control:** Use the speed buttons (0.5x, 1x, 1.5x, 2x, 3x, 4x) to adjust the speed of the timeline animation. Clicking a speed button will also start the animation if it's paused.  
* **Info Panel:** The panel on the left displays timeline changes as the animation progresses. Clicking on an MSA or a marked point on the map will display the full historical timeline for that location in this panel.  
* **Legend:** The legend on the map shows the color coding for each sect.  
* **Advanced Options:** Click the "Advanced Options" button below the Info Panel to reveal options for loading a local JSON data file or opening the Timeline Editor.

### **Timeline Editor (timeline\_editor.html)**

* Open the Timeline Editor by clicking the "Open Timeline Editor" button in the Advanced Options of the map viewer, or by opening timeline\_editor.html directly in your browser.  
* **Load Data:** Use the "Choose JSON File" input to load your lotslarp\_timeline\_data.json file into the editor.  
* **Select MSA:** Click on an MSA name in the list on the right sidebar to load its timeline for editing.  
* **Edit Timeline Entries:** Modify the start year, end year, sect, and description for each period in the selected MSA's timeline.  
* **Add/Remove Entries:** Use the "Add Timeline Entry" button to add a new entry at the end, or the "Remove" button within each entry to delete it.  
* **Add/Remove MSAs:** Use the buttons in the left sidebar to manually add a new MSA or remove the currently selected one.  
* **Rename MSA:** Change the name of the selected MSA.  
* **Search:** Filter the MSA list by typing in the search box.  
* **Add Missing MSA:** Add an MSA from the GeoJSON data that is not currently in your timeline data.  
* **Clone Timeline:** Copy the timeline data from one MSA to another.  
* **Bulk Edit:** Shift all dates for the selected MSA's timeline by a specified number of years.  
* **Export JSON:** Click the "Export JSON" button to download your modified timeline data as a JSON file.

## **Data**

The map uses a GeoJSON file containing the boundaries of US Metropolitan and Micropolitan Statistical Areas. The timeline data is stored in a JSON file (lotslarp\_timeline\_data.json) with a specific structure defining the historical control of sects over these areas and other key points.

You can modify the lotslarp\_timeline\_data.json file using the Timeline Editor to customize the history displayed on the map.

## **Contributing**

If you have suggestions for improving the map viewer, editor, or the timeline data itself, feel free to open an issue or submit a pull request on the GitHub repository.