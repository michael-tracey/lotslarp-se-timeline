const sectColors = {
    "Sabbat": "#ff0000",
    "Camarilla": "#0000ff",
    "Anarchs": "#00ff00",
    "Independent Alliance": "#ffff00",
    "Vodouists": "#ffa500",
    "Southern Lords": "#9b870c",
    "Contested": "#800080",
    "Unclaimed": "#cccccc",
    "Unknown": "#cccccc"
};

function showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = 'show';
    setTimeout(function(){ snackbar.className = snackbar.className.replace('show', ''); }, 3000);
}

function loadTimelineDataFromFirestore(callback, errorCallback) {
    const db = firebase.firestore();
    const docRef = db.collection("timelineData").doc("vampireTimeline");
    docRef.get().then((doc) => {
        if (doc.exists) {
            callback(doc.data().data);
        } else {
            console.log("No such document in Firestore!");
            if(errorCallback) errorCallback();
        }
    }).catch((error) => {
        console.log("Error getting document from Firestore:", error);
        if(errorCallback) errorCallback();
    });
}

function saveTimelineDataToFirestore(timelineData, successCallback, errorCallback) {
    const db = firebase.firestore();
    const docRef = db.collection("timelineData").doc("vampireTimeline");
    docRef.set({ data: timelineData })
        .then(() => {
            if(successCallback) successCallback();
        })
        .catch((error) => {
            console.error("Error saving timeline data to Firestore: ", error);
            if(errorCallback) errorCallback();
        });
}
