#!/bin/bash

# Check if firebase.json exists
if [ ! -f "firebase.json" ]; then
  echo "firebase.json not found. Please run 'firebase init' first."
  exit 1
fi

# Deploy to Firebase
firebase deploy
