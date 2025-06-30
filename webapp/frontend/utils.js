// Utility functions for the shape drawing application

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param {number} x - X coordinate of the point
 * @param {number} y - Y coordinate of the point
 * @param {Array} points - Array of polygon points with x, y coordinates
 * @returns {boolean} - True if point is inside polygon
 */
export function isPointInPolygon(x, y, points) {
    let inside = false;
    let j = points.length - 1;
    
    for (let i = 0; i < points.length; i++) {
        const xi = points[i].x;
        const yi = points[i].y;
        const xj = points[j].x;
        const yj = points[j].y;
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
        j = i;
    }
    
    return inside;
}

/**
 * Find the index of a point at given coordinates within a shape
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} shape - Shape object with points array
 * @param {number} pointRadius - Radius to search around point (default: 8)
 * @returns {number} - Index of the point, or -1 if not found
 */
export function getPointAt(x, y, shape, pointRadius = 8) {
    for (let i = 0; i < shape.points.length; i++) {
        const point = shape.points[i];
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        if (distance <= pointRadius) {
            return i;
        }
    }
    return -1;
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {number} - Distance between points
 */
export function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Generate a unique ID for shapes
 * @returns {string} - Unique ID
 */
export function generateShapeId() {
    return 'shape_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Validate shape data structure
 * @param {Object} shape - Shape object to validate
 * @returns {boolean} - True if shape is valid
 */
export function validateShape(shape) {
    return shape.name && 
           Array.isArray(shape.points) &&
           shape.points.every(point => 
               typeof point.x === 'number' && typeof point.y === 'number'
           );
}

/**
 * Create a download link for a file
 * @param {string} content - File content
 * @param {string} filename - Name of the file to download
 * @param {string} mimeType - MIME type of the file
 */
export function downloadFile(content, filename, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Format date for filename
 * @returns {string} - Formatted date string
 */
export function getFormattedDate() {
    return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
} 