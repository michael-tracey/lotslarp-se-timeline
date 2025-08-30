
const admin = require('firebase-admin');
const fs = require('fs');

// IMPORTANT: Replace with the path to your service account key file.
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Path to your JSON file
const jsonFilePath = './vampire-timeline-data.json';

fs.readFile(jsonFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the JSON file:', err);
    return;
  }

  const timelineData = JSON.parse(data);

  const batch = db.batch();

  timelineData.forEach((msa) => {
    const docId = msa.name.replace(/\//g, '_');
    const docRef = db.collection('timeline').doc(docId);
    batch.set(docRef, msa);
  });

  batch.commit()
    .then(() => {
      console.log('Data successfully uploaded to Firestore!');
    })
    .catch((error) => {
      console.error('Error uploading data to Firestore:', error);
    });
});
