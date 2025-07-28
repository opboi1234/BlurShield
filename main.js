class PrivacyScreenshotCleaner {
    constructor() {
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.originalImageData = null;
        this.detections = [];
        this.blurIntensity = 15;
        
        this.patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
            creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
            ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
            ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
            url: /https?:\/\/[^\s<>"{}|\\^`[\]]+/g
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const scanBtn = document.getElementById('scanBtn');
        const clearBtn = document.getElementById('clearBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const resetBtn = document.getElementById('resetBtn');
        const blurSlider = document.getElementById('blurIntensity');
        const intensityValue = document.getElementById('intensityValue');

        // File upload events
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Control events
        scanBtn.addEventListener('click', this.startScanning.bind(this));
        clearBtn.addEventListener('click', this.clearCanvas.bind(this));
        downloadBtn.addEventListener('click', this.downloadImage.bind(this));
        resetBtn.addEventListener('click', this.resetApp.bind(this));

        // Blur intensity slider
        blurSlider.addEventListener('input', (e) => {
            this.blurIntensity = parseInt(e.target.value);
            intensityValue.textContent = this.blurIntensity;
            if (this.detections.length > 0) {
                this.redrawWithBlur();
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    loadImage(imageSrc) {
        const img = new Image();
        img.onload = () => {
            // Set canvas size to match image
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            
            // Draw image on canvas
            this.ctx.drawImage(img, 0, 0);
            
            // Store original image data
            this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Show canvas and enable controls
            document.getElementById('canvasContainer').style.display = 'inline-block';
            document.getElementById('placeholderText').style.display = 'none';
            document.getElementById('scanBtn').disabled = false;
            document.getElementById('clearBtn').disabled = false;
            
            this.showToast('Image loaded successfully! Ready to scan.', 'success');
        };
        img.onerror = () => {
            this.showToast('Failed to load image. Please try another file.', 'error');
        };
        img.src = imageSrc;
    }

    async startScanning() {
        if (!this.originalImageData) {
            this.showToast('Please upload an image first', 'error');
            return;
        }

        // Show scanning overlay
        const overlay = document.getElementById('scanningOverlay');
        overlay.style.display = 'flex';
        
        // Reset detections
        this.detections = [];
        
        // Simulate scanning process with progress
        await this.simulateScanning();
        
        // Perform actual detection
        await this.performDetection();
        
        // Hide overlay and show results
        overlay.style.display = 'none';
        this.displayResults();
        this.applyBlurEffects();
    }

    async simulateScanning() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const scanningText = document.getElementById('scanningText');
        
        const steps = [
            { progress: 20, text: 'Analyzing image structure...' },
            { progress: 40, text: 'Detecting text patterns...' },
            { progress: 60, text: 'Scanning for email addresses...' },
            { progress: 80, text: 'Checking phone numbers...' },
            { progress: 95, text: 'Identifying sensitive data...' },
            { progress: 100, text: 'Finalizing results...' }
        ];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 500));
            progressFill.style.width = `${step.progress}%`;
            progressText.textContent = `${step.progress}%`;
            scanningText.textContent = step.text;
        }
    }

    async performDetection() {
        // Simulate OCR text extraction - in a real app, you'd use Tesseract.js here
        const mockText = this.generateMockText();
        
        // Reset counters
        let emailCount = 0, phoneCount = 0, cardCount = 0;
        
        // Detect patterns and create blur regions
        Object.entries(this.patterns).forEach(([type, pattern]) => {
            const matches = mockText.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Generate random position for demonstration
                    const detection = {
                        type,
                        text: match,
                        x: Math.random() * (this.canvas.width - 200),
                        y: Math.random() * (this.canvas.height - 50),
                        width: match.length * 8 + 20, // Approximate width based on text length
                        height: 25
                    };
                    
                    this.detections.push(detection);
                    
                    // Update counters
                    if (type === 'email') emailCount++;
                    else if (type === 'phone') phoneCount++;
                    else if (type === 'creditCard') cardCount++;
                });
            }
        });

        // Update stats display
        document.getElementById('emailCount').textContent = emailCount;
        document.getElementById('phoneCount').textContent = phoneCount;
        document.getElementById('cardCount').textContent = cardCount;
        document.getElementById('totalCount').textContent = this.detections.length;
    }

    generateMockText() {
        // Simulate extracted text with some sensitive information
        const mockTexts = [
            'Contact us at support@company.com or call (555) 123-4567',
            'My email is john.doe@example.com and my phone is 555-987-6543',
            'Credit card: 4532 1234 5678 9012 expires 12/25',
            'Please reach out to info@startup.io for more details',
            'Customer service: 1-800-555-0123 or help@service.com'
        ];
        
        // Return a random combination of mock texts
        return mockTexts.slice(0, Math.floor(Math.random() * 3) + 2).join(' ');
    }

    displayResults() {
        const statsElement = document.getElementById('detectionStats');
        if (this.detections.length > 0) {
            statsElement.style.display = 'block';
            this.showToast(`Found ${this.detections.length} sensitive items!`, 'success');
        } else {
            statsElement.style.display = 'none';
            this.showToast('No sensitive information detected', 'info');
        }
    }

    applyBlurEffects() {
        // Restore original image
        this.ctx.putImageData(this.originalImageData, 0, 0);
        
        // Apply blur to detected regions
        this.detections.forEach(detection => {
            this.blurRegion(detection.x, detection.y, detection.width, detection.height);
        });
        
        // Show download controls
        document.getElementById('processedControls').style.display = 'flex';
    }

    blurRegion(x, y, width, height) {
        // Get the region to blur
        const imageData = this.ctx.getImageData(x, y, width, height);
        const data = imageData.data;
        
        // Apply simple blur effect by averaging pixel values
        const blurAmount = this.blurIntensity;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // Put the region on temp canvas
        tempCtx.putImageData(imageData, 0, 0);
        
        // Apply CSS blur filter
        tempCtx.filter = `blur(${blurAmount}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);
        
        // Draw blurred region back to main canvas
        this.ctx.drawImage(tempCanvas, x, y);
        
        // Add red overlay for visual indication
        this.ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
        this.ctx.fillRect(x, y, width, height);
        
        // Add border
        this.ctx.strokeStyle = '#ff4444';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
    }

    redrawWithBlur() {
        if (this.originalImageData) {
            this.applyBlurEffects();
        }
    }

    clearCanvas() {
        if (this.originalImageData) {
            this.ctx.putImageData(this.originalImageData, 0, 0);
            this.detections = [];
            document.getElementById('detectionStats').style.display = 'none';
            document.getElementById('processedControls').style.display = 'none';
            this.showToast('Blur effects cleared', 'info');
        }
    }

    downloadImage() {
        if (!this.canvas) {
            this.showToast('No image to download', 'error');
            return;
        }

        // Create download link
        const link = document.createElement('a');
        link.download = `privacy-cleaned-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Clean image downloaded successfully!', 'success');
    }

    resetApp() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset state
        this.originalImageData = null;
        this.detections = [];
        
        // Reset UI
        document.getElementById('canvasContainer').style.display = 'none';
        document.getElementById('placeholderText').style.display = 'flex';
        document.getElementById('detectionStats').style.display = 'none';
        document.getElementById('processedControls').style.display = 'none';
        document.getElementById('scanBtn').disabled = true;
        document.getElementById('clearBtn').disabled = true;
        document.getElementById('fileInput').value = '';
        
        this.showToast('Ready for new image', 'info');
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        
        // Set toast color based on type
        const colors = {
            success: 'rgba(0, 255, 136, 0.9)',
            error: 'rgba(255, 68, 68, 0.9)',
            info: 'rgba(0, 136, 255, 0.9)'
        };
        
        toast.style.background = colors[type] || colors.info;
        toast.classList.add('show');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PrivacyScreenshotCleaner();
    
    // Add some visual flair on load
    setTimeout(() => {
        document.querySelector('.header h1').style.animation = 'glow 2s ease-in-out infinite alternate';
    }, 500);
});

// Add some interactive effects
document.addEventListener('mousemove', (e) => {
    const features = document.querySelectorAll('.feature');
    features.forEach(feature => {
        const rect = feature.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            feature.style.background = 'rgba(0, 255, 136, 0.1)';
        } else {
            feature.style.background = 'rgba(255, 255, 255, 0.05)';
        }
    });
});
