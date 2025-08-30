# LotsLarp Sect Timeline

A web-based interactive map viewer and editor for visualizing the historical control of different vampire sects over Metropolitan Statistical Areas (MSAs) and key locations in the Southern and Eastern United States, based on the LotsLarp setting. This project is now powered by Firebase for data storage and hosting.

## Features

*   **Interactive Map:** Displays sect control by year on an interactive map.
*   **Timeline Navigation:** A slider allows you to move through time and see how sect control has changed.
*   **Playback Controls:** Play, pause, and adjust the speed of the timeline animation.
*   **Info Panel:** Click on an MSA or point of interest to view its detailed history.
*   **Firebase Backend:** Timeline data is stored in Firestore, providing a scalable and real-time database.
*   **Timeline Editor:** A separate interface for creating, updating, and deleting timeline data directly in Firestore.
*   **Deployment:** Easily deploy the application using Firebase Hosting.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) installed on your local machine.
*   A [Firebase](https://firebase.google.com/) project.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd lotslarp-sect-timeline
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Firebase Configuration:**
    *   Create a new Firebase project in the [Firebase console](https://console.firebase.google.com/).
    *   In your project's settings, create a new web app and copy the `firebaseConfig` object.
    *   Create a file named `firebase-config.js` in the root of the project and paste the `firebaseConfig` object into it, like so:
        ```javascript
        const firebaseConfig = {
          apiKey: "YOUR_API_KEY",
          authDomain: "YOUR_AUTH_DOMAIN",
          projectId: "YOUR_PROJECT_ID",
          storageBucket: "YOUR_STORAGE_BUCKET",
          messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
          appId: "YOUR_APP_ID"
        };
        ```

4.  **Service Account Key:**
    *   In your Firebase project settings, go to the "Service accounts" tab and generate a new private key.
    *   Rename the downloaded JSON file to `serviceAccountKey.json` and place it in the root of the project.
    *   **Important:** Add `serviceAccountKey.json` to your `.gitignore` file to prevent it from being committed to version control.

5.  **Load Data into Firestore:**
    *   Run the `load_data.js` script to populate your Firestore database with the initial timeline data:
        ```bash
        node load_data.js
        ```

### Running Locally

1.  **Start the Firebase Emulators:**
    ```bash
    firebase emulators:start
    ```
2.  Open your web browser and navigate to `http://localhost:5000` to see the application.

## Usage

### Map Viewer

*   **Timeline Navigation:** Use the slider at the bottom of the map to manually change the year.
*   **Play/Pause:** Click the "Play" button to start the timeline animation.
*   **Speed Control:** Adjust the animation speed with the provided buttons.
*   **Info Panel:** Displays timeline changes as the animation progresses. Click on an MSA or a marked point to see its full history.

### Timeline Editor (`timeline_editor.html`)

*   Open the editor by navigating to `timeline_editor.html` in your browser.
*   **Load Data:** The editor will automatically load the data from your Firestore database.
*   **Select MSA:** Click on an MSA from the list to load its timeline for editing.
*   **Edit Entries:** Modify the start year, end year, sect, and description for each period.
*   **Add/Remove Entries:** Add new timeline entries or remove existing ones.
*   **Save Changes:** Changes are automatically saved to Firestore as you make them.

## Deployment

This project is configured for deployment with Firebase Hosting.

1.  **Login to Firebase:**
    ```bash
    firebase login
    ```

2.  **Deploy:**
    ```bash
    firebase deploy
    ```

This will deploy the contents of the `public` directory to Firebase Hosting.

## Data

The map uses a GeoJSON file containing the boundaries of US Metropolitan and Micropolitan Statistical Areas. The timeline data is stored in the `timeline` collection in Firestore.

## Contributing

If you have suggestions for improving the map viewer, editor, or the timeline data itself, feel free to open an issue or submit a pull request on the GitHub repository.
