import { 
    isPointInPolygon, 
    getPointAt, 
    calculateDistance, 
    generateShapeId, 
    validateShape, 
    downloadFile, 
    getFormattedDate 
} from './utils.js';

class ShapeDrawingApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.cameraFeed = document.getElementById('camera-feed');
        
        this.shapes = [];
        this.activeShapeId = null;
        this.isDrawing = false;
        this.dragPoint = null;
        this.lastClickTime = 0;
        this.clickThreshold = 5; // pixels
        this.doubleClickThreshold = 300; // ms
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.bindEvents();
        this.loadInitialState();
    }

    setupCanvas() {
        // Set up canvas when camera feed loads
        this.cameraFeed.addEventListener('load', () => {
            this.resizeCanvas();
        });

        this.cameraFeed.addEventListener('loadeddata', () => {
            this.resizeCanvas();
        });

        // Fallback: resize canvas after a short delay
        setTimeout(() => {
            this.resizeCanvas();
        }, 1000);

        this.cameraFeed.addEventListener('error', () => {
            this.showToast('Failed to connect to camera', 'error');
        });

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        // Get the camera container dimensions
        const container = this.cameraFeed.parentElement;
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // Set canvas to match container size
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        
        // Position canvas to overlay the camera feed
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';
        
        this.render();
    }

    bindEvents() {
        // Toolbar events
        document.getElementById('new-shape-btn').addEventListener('click', () => this.startNewShape());
        document.getElementById('save-remote-btn').addEventListener('click', () => this.saveRemote());
        document.getElementById('save-device-btn').addEventListener('click', () => this.saveToDevice());
        document.getElementById('upload-btn').addEventListener('click', () => this.uploadFile());
        
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // File upload
        document.getElementById('file-upload').addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    startNewShape() {
        console.log('Starting new shape...');
        const id = generateShapeId();
        const shape = {
            id: id,
            name: `Shape ${this.shapes.length + 1}`,
            points: []
        };
        
        this.shapes.push(shape);
        this.activeShapeId = id;
        this.isDrawing = true;
        
        console.log('New shape created:', shape);
        console.log('isDrawing:', this.isDrawing);
        
        this.updateUI();
        this.updateShapeList();
        this.render();
    }

    handleCanvasClick(e) {
        console.log('Canvas clicked, isDrawing:', this.isDrawing);
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('Click coordinates:', x, y);
        
        // If we're dragging, don't handle click
        if (this.dragPoint) return;

        // Check if we clicked on any shape (for selection)
        const clickedShape = this.getShapeAt(x, y);
        if (clickedShape && clickedShape.id !== this.activeShapeId) {
            this.selectShape(clickedShape.id);
            return;
        }

        // If we're not drawing, clicking on empty space should do nothing
        if (!this.isDrawing) {
            console.log('Not drawing, ignoring click');
            return;
        }
        
        const activeShape = this.getActiveShape();
        if (!activeShape) {
            console.log('No active shape found');
            return;
        }

        // Check if clicking on existing point for deletion
        const clickedPoint = getPointAt(x, y, activeShape);
        if (clickedPoint !== -1) {
            const now = Date.now();
            if (now - this.lastClickTime < this.doubleClickThreshold) {
                // Delete point
                activeShape.points.splice(clickedPoint, 1);
                if (activeShape.points.length < 3) {
                    activeShape.points = activeShape.points.slice(); // Keep existing points
                }
                this.render();
                return;
            }
            this.lastClickTime = now;
            return;
        }

        // Add new point
        activeShape.points.push({ x, y });
        console.log('Added point:', { x, y });
        console.log('Shape points now:', activeShape.points);
        this.render();
    }

    // Find which shape was clicked
    getShapeAt(x, y) {
        // Check shapes in reverse order (topmost first)
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (shape.points.length < 3) continue; // Skip incomplete shapes
            
            // Use point-in-polygon algorithm
            if (isPointInPolygon(x, y, shape.points)) {
                return shape;
            }
        }
        return null;
    }

    handleMouseDown(e) {
        if (!this.activeShapeId) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const activeShape = this.getActiveShape();
        if (!activeShape) return;

        const pointIndex = getPointAt(x, y, activeShape);
        if (pointIndex !== -1) {
            this.dragPoint = { index: pointIndex, startX: x, startY: y };
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.dragPoint) {
            const activeShape = this.getActiveShape();
            if (activeShape && activeShape.points[this.dragPoint.index]) {
                activeShape.points[this.dragPoint.index] = { x, y };
                this.render();
            }
        } else {
            // Update cursor based on hover state
            const activeShape = this.getActiveShape();
            if (activeShape && getPointAt(x, y, activeShape) !== -1) {
                this.canvas.style.cursor = 'grab';
            } else if (this.getShapeAt(x, y)) {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = this.isDrawing ? 'crosshair' : 'default';
            }
        }
    }

    handleMouseUp(e) {
        if (this.dragPoint) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if we actually moved the point (for deletion logic)
            const distance = calculateDistance(x, y, this.dragPoint.startX, this.dragPoint.startY);
            
            if (distance < this.clickThreshold) {
                // This was a click, not a drag - handle deletion
                const activeShape = this.getActiveShape();
                if (activeShape && activeShape.points.length > 3) {
                    activeShape.points.splice(this.dragPoint.index, 1);
                    this.render();
                }
            }
        }
        
        this.dragPoint = null;
        
        // Update cursor based on current position
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const activeShape = this.getActiveShape();
        
        if (activeShape && getPointAt(x, y, activeShape) !== -1) {
            this.canvas.style.cursor = 'grab';
        } else if (this.getShapeAt(x, y)) {
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = this.isDrawing ? 'crosshair' : 'default';
        }
    }

    getActiveShape() {
        return this.shapes.find(shape => shape.id === this.activeShapeId);
    }

    selectShape(shapeId) {
        this.activeShapeId = shapeId;
        this.isDrawing = false;
        this.updateUI();
        this.render();
    }

    deleteShape(shapeId) {
        this.shapes = this.shapes.filter(shape => shape.id !== shapeId);
        if (this.activeShapeId === shapeId) {
            this.activeShapeId = null;
            this.isDrawing = false;
        }
        this.updateShapeList();
        this.render();
    }

    renameShape(shapeId, newName) {
        const shape = this.shapes.find(s => s.id === shapeId);
        if (shape) {
            shape.name = newName;
        }
    }

    updateShapeList() {
        const shapeList = document.getElementById('shape-list');
        shapeList.innerHTML = '';

        this.shapes.forEach(shape => {
            const li = document.createElement('li');
            li.className = `shape-item ${shape.id === this.activeShapeId ? 'active' : ''}`;
            li.innerHTML = `
                <div class="shape-click-area"></div>
                <div class="shape-content">
                    <input type="text" class="shape-name" value="${shape.name}" 
                           onchange="app.renameShape('${shape.id}', this.value)"
                           onclick="event.stopPropagation()">
                    <button class="delete-btn" onclick="event.stopPropagation(); app.deleteShape('${shape.id}')" 
                            title="Delete shape">×</button>
                </div>
            `;
            
            // Add click handler to the entire item
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.shape-name') && !e.target.closest('.delete-btn')) {
                    this.selectShape(shape.id);
                }
            });
            
            shapeList.appendChild(li);
        });
    }

    updateUI() {
        const newShapeBtn = document.getElementById('new-shape-btn');
        newShapeBtn.classList.toggle('active', this.isDrawing);
        this.updateShapeList();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw a test border to make sure canvas is visible
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

        this.shapes.forEach(shape => {
            if (shape.points.length === 0) return;

            const isActive = shape.id === this.activeShapeId;
            
            // Draw shape outline and fill
            if (shape.points.length >= 2) {
                this.ctx.beginPath();
                this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
                
                for (let i = 1; i < shape.points.length; i++) {
                    this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                }
                
                // Close the path if we have 3+ points
                if (shape.points.length >= 3) {
                    this.ctx.closePath();
                    
                    // Fill the shape - active shape uses orange color
                    this.ctx.fillStyle = isActive ? 'rgba(255, 152, 0, 0.5)' : 'rgba(76, 175, 80, 0.3)';
                    this.ctx.fill();
                }
                
                // Draw the outline - active shape uses orange color
                this.ctx.strokeStyle = isActive ? '#FF9800' : '#4CAF50';
                this.ctx.lineWidth = isActive ? 3 : 2;
                this.ctx.stroke();
            } else if (shape.points.length === 1) {
                // Single point - draw as a circle
                this.ctx.beginPath();
                this.ctx.arc(shape.points[0].x, shape.points[0].y, 4, 0, 2 * Math.PI);
                this.ctx.fillStyle = isActive ? '#FF9800' : '#4CAF50';
                this.ctx.fill();
            }

            // Draw edit points only for active shape
            if (isActive) {
                shape.points.forEach(point => {
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#FF9800';
                    this.ctx.strokeStyle = '#F57C00';
                    this.ctx.lineWidth = 2;
                    this.ctx.fill();
                    this.ctx.stroke();
                });
            }
        });
    }

    async saveRemote() {
        if (this.shapes.length === 0) {
            this.showToast('No shapes to save', 'error');
            return;
        }

        try {
            const data = {
                shapes: this.shapes.map(shape => ({
                    id: shape.id,
                    name: shape.name,
                    points: shape.points
                }))
            };

            const response = await fetch('http://localhost:5001/save_shapes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                this.showToast(`Shapes saved as ${result.filename}`);
            } else {
                throw new Error('Failed to save shapes');
            }
        } catch (error) {
            this.showToast('Error saving shapes: ' + error.message, 'error');
        }
    }

    saveToDevice() {
        if (this.shapes.length === 0) {
            this.showToast('No shapes to save', 'error');
            return;
        }

        const data = {
            shapes: this.shapes.map(shape => ({
                id: shape.id,
                name: shape.name,
                points: shape.points
            })),
            exported_at: new Date().toISOString()
        };

        const content = JSON.stringify(data, null, 2);
        const filename = `shapes_${getFormattedDate()}.json`;
        downloadFile(content, filename);

        this.showToast('Shapes downloaded');
    }

    uploadFile() {
        document.getElementById('file-upload').click();
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.shapes && Array.isArray(data.shapes)) {
                    // Validate shapes structure
                    const validShapes = data.shapes.filter(validateShape);

                    if (validShapes.length > 0) {
                        // Assign new IDs to avoid conflicts
                        validShapes.forEach(shape => {
                            shape.id = generateShapeId();
                        });

                        this.shapes = [...this.shapes, ...validShapes];
                        this.updateShapeList();
                        this.render();
                        this.showToast(`Loaded ${validShapes.length} shapes`);
                    } else {
                        this.showToast('No valid shapes found in file', 'error');
                    }
                } else {
                    this.showToast('Invalid file format', 'error');
                }
            } catch (error) {
                this.showToast('Error parsing file: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    }

    handleKeyDown(e) {
        if (e.key === 'Delete' && this.activeShapeId) {
            this.deleteShape(this.activeShapeId);
        } else if (e.key === 'Escape') {
            this.activeShapeId = null;
            this.isDrawing = false;
            this.updateUI();
            this.updateShapeList();
            this.render();
        }
    }

    showToast(message, type = 'success') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    loadInitialState() {
        // Any initial setup can go here
        this.updateShapeList();
        this.render();
    }
}

// Initialize the app
const app = new ShapeDrawingApp();

// Add tooltip functionality
document.addEventListener('mouseover', (e) => {
    if (e.target.hasAttribute('title')) {
        const tooltip = document.getElementById('tooltip');
        tooltip.textContent = e.target.getAttribute('title');
        tooltip.style.opacity = '1';
        
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.hasAttribute('title')) {
        document.getElementById('tooltip').style.opacity = '0';
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    app.resizeCanvas();
});

// Make app globally available for inline event handlers
window.app = app; 