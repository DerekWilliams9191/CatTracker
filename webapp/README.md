# Cat Detector - Motion Detection System

## Overview

The Cat Detector is a web-based application that allows users to define motion detection regions on a live camera feed by drawing custom shapes directly on the video stream.

## Features

### Shape Management
- Click "Add Shape" to create a new detection region
- Click on the camera feed to place points and create polygon shapes
- Click on shapes or sidebar circles to activate/deactivate them
- Click on shape names in the sidebar to rename them
- Delete shapes using the X button

### Visual Indicators
- Active shapes appear blue with white corner points and filled circles in the sidebar
- Inactive shapes appear gray without corner points and empty circles in the sidebar
- All shapes have solid outlines with 50% opacity fills

### Saving and Loading
- Automatically saves to server every 5 seconds
- Shows save status: "saved", "autosave in progress", or when changes are unsaved
- Save button downloads shapes as JSON file to local computer
- Upload button sends JSON file to server and overwrites current shapes
- Automatically loads shapes from server when the site launches

## How to Use

1. Click "Add Shape" to start creating a detection region
2. Click points on the camera feed to define the shape boundaries
3. Click "Finish Shape" when done placing points
4. Use the sidebar to manage your shapes - activate, rename, or delete them
5. Your shapes are automatically saved to the server every 5 seconds


## Run the Development Server
```bash
npm run dev
```