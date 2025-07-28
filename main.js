// Enhanced Auto-Privacy Screenshot Cleaner with Fixed Detection
class PrivacyScreenshotCleaner {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.bindEvents();
        this.loadFaceApiModels();
    }

    initializeElements() {
        this.imageUpload = document.getElementById('imageUpload');
        this.uploadSection = document.getElementById('uploadSection');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.blurSlider = document.getElementById('blurSlider');
        this.blurValue = document.getElementById('blurValue');
        this.blurPreview = document.getElementById('blurPreview');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.progressBar = document.getElementById('progressBar');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.placeholder = document.getElementById('placeholder');
        this.detectionStats = document.getElementById('detectionStats');
        this.detectedItemsList = document.getElementById('detectedItemsList');
        this.detectedItemsContent = document.getElementById('detectedItemsContent');
        
        // Checkboxes
        this.blurNameCheck = document.getElementById('blurNameCheck');
        this.userNameInput = document.getElementById('userNameInput');
        this.detectEmails = document.getElementById('detectEmails');
        this.detectPhones = document.getElementById('detectPhones');
        this.detectFaces = document.getElementById('detectFaces');
        this.detectAddresses = document.getElementById('detectAddresses');
        this.detectCreditCards = document.getElementById('detectCreditCards');
        this.detectSSN = document.getElementById('detectSSN');
        
        // Stats
        this.textDetections = document.getElementById('textDetections');
        this.faceDetections = document.getElementById('faceDetections');
        this.totalDetections = document.getElementById('totalDetections');
    }

    initializeState() {
        this.originalImage = null;
        this.originalImageData = null;
        this.detectedRects = [];
        this.detectedFaces = [];
        this.detectedItems = [];
        this.blurStrength = parseInt(this.blurSlider.value);
        this.userName = '';
        this.faceApiLoaded = false;
        this.updateBlurPreview();
    }

    bindEvents() {
        // File upload events
        this.imageUpload.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadSection.addEventListener('click', () => this.imageUpload.click());
        this.uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadSection.addEventListener('dragleave', () => this.uploadSection.classList.remove('dragover'));

        // Control events
        this.blurSlider.addEventListener('input', (e) => this.handleBlurChange(e));
        this.blurNameCheck.addEventListener('change', (e) => this.handleNameBlurToggle(e));
        this.userNameInput.addEventListener('input', (e) => this.handleNameInput(e));
        
        // Detection setting changes
        [this.detectEmails, this.detectPhones, this.detectFaces, this.detectAddresses, this.detectCreditCards, this.detectSSN]
            .forEach(checkbox => checkbox.addEventListener('change', () => this.reprocessImage()));

        // Button events
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.resetBtn.addEventListener('click', () => this.resetAll());
    }

    async loadFaceApiModels() {
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
            this.faceApiLoaded = true;
            console.log('Face API models loaded successfully');
        } catch (error) {
            console.warn('Face detection unavailable:', error);
            this.faceApiLoaded = false;
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadSection.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadSection.classList.remove('dragover');
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
        if (!this.validateFile(file)) return;

        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.setupCanvas(img);
            this.processImage(img);
        };
        img.src = URL.createObjectURL(file);
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];

        if (!validTypes.includes(file.type)) {
            this.showToast('Please upload a PNG or JPEG image', 'error');
            return false;
        }

        if (file.size > maxSize) {
            this.showToast('File size must be less than 10MB', 'error');
            return false;
        }

        return true;
    }

    setupCanvas(img) {
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = img;
        
        // Calculate scaling to fit within max dimensions while maintaining aspect ratio
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        
        this.canvas.width = width * scale;
        this.canvas.height = height * scale;
        this.canvas.style.display = 'block';
        this.placeholder.style.display = 'none';
        
        // Store the scale for coordinate mapping
        this.canvasScale = scale;
    }

    async processImage(img) {
        this.showLoading(true, 'Analyzing image...');
        this.updateProgress(10);
        
        // Draw original image and store image data
        this.drawImage(img);
        this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset detection arrays
        this.detectedRects = [];
        this.detectedFaces = [];
        this.detectedItems = [];

        try {
            // OCR Processing
            this.updateProgress(30);
            this.updateLoadingText('Detecting text and sensitive information...');
            await this.performOCR(img);
            
            // Face Detection
            if (this.detectFaces.checked && this.faceApiLoaded) {
                this.updateProgress(70);
                this.updateLoadingText('Detecting faces...');
                await this.performFaceDetection(img);
            }

            // Apply blurring
            this.updateProgress(90);
            this.updateLoadingText('Applying privacy filters...');
            this.applyBlurring();
            
            this.updateProgress(100);
            this.showLoading(false);
            this.updateStats();
            this.updateDetectedItemsList();
            this.showControls(true);
            
            const totalDetected = this.detectedRects.length + this.detectedFaces.length;
            if (totalDetected > 0) {
                this.showToast(`Successfully detected and blurred ${totalDetected} sensitive items!`, 'success');
            } else {
                this.showToast('No sensitive information detected in this image.', 'info');
            }
            
        } catch (error) {
            console.error('Processing error:', error);
            this.showLoading(false);
            this.showToast('Error processing image: ' + error.message, 'error');
        }
    }

    async performOCR(img) {
        try {
            const { data } = await Tesseract.recognize(img, 'eng', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        this.updateProgress(30 + (m.progress * 30));
                    }
                }
            });

            console.log('OCR completed, processing words...');
            
            data.words.forEach(word => {
                if (!word.text || word.confidence < 30) return; // Skip low confidence words
                
                const text = word.text.trim();
                const bbox = word.bbox;
                
                // Check if this text contains sensitive information
                const sensitiveType = this.getSensitiveType(text);
                if (sensitiveType) {
                    const rect = this.mapBboxToCanvas(bbox, img);
                    
                    // Add some padding to the detection rectangle
                    rect.x = Math.max(0, rect.x - 5);
                    rect.y = Math.max(0, rect.y - 5);
                    rect.w = Math.min(this.canvas.width - rect.x, rect.w + 10);
                    rect.h = Math.min(this.canvas.height - rect.y, rect.h + 10);
                    
                    this.detectedRects.push(rect);
                    this.detectedItems.push({
                        type: sensitiveType,
                        text: text,
                        confidence: word.confidence
                    });
                    
                    console.log(`Detected ${sensitiveType}: "${text}" with confidence ${word.confidence}`);
                }
            });
            
            console.log(`Total sensitive items detected: ${this.detectedRects.length}`);
            
        } catch (error) {
            console.error('OCR Error:', error);
            throw new Error('Failed to analyze text in image');
        }
    }

    getSensitiveType(text) {
        // More comprehensive and accurate regex patterns
        const patterns = {
            email: {
                regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                enabled: () => this.detectEmails.checked
            },
            phone: {
                regex: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
                enabled: () => this.detectPhones.checked
            },
            creditCard: {
                regex: /\b(?:\d[ -]*?){13,19}\b/g,
                enabled: () => this.detectCreditCards.checked
            },
            ssn: {
                regex: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
                enabled: () => this.detectSSN.checked
            },
            address: {
                regex: /\b\d+\s+[A-Za-z0-9\s,]+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?|Court|Ct\.?|Place|Pl\.?)\b/gi,
                enabled: () => this.detectAddresses.checked
            },
            name: {
                regex: new RegExp(this.userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                enabled: () => this.blurNameCheck.checked && this.userName.length > 0
            }
        };

        // Check each pattern
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.enabled() && pattern.regex.test(text)) {
                return type;
            }
        }

        return null;
    }

    async performFaceDetection(img) {
        if (!this.faceApiLoaded) return;

        try {
            const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5
            }));
            
            console.log(`Face detection completed. Found ${detections.length} faces.`);
            
            detections.forEach((detection, index) => {
                const box = detection.box;
                const rect = {
                    x: (box.x / img.width) * this.canvas.width,
                    y: (box.y / img.height) * this.canvas.height,
                    w: (box.width / img.width) * this.canvas.width,
                    h: (box.height / img.height) * this.canvas.height
                };
                
                // Add some padding around faces
                rect.x = Math.max(0, rect.x - 10);
                rect.y = Math.max(0, rect.y - 10);
                rect.w = Math.min(this.canvas.width - rect.x, rect.w + 20);
                rect.h = Math.min(this.canvas.height - rect.y, rect.h + 20);
                
                this.detectedFaces.push(rect);
                this.detectedItems.push({
                    type: 'face',
                    text: `Face ${index + 1}`,
                    confidence: Math.round(detection.score * 100)
                });
            });
        } catch (error) {
            console.error('Face detection error:', error);
        }
    }

    mapBboxToCanvas(bbox, img) {
        return {
            x: (bbox.x0 / img.width) * this.canvas.width,
            y: (bbox.y0 / img.height) * this.canvas.height,
            w: ((bbox.x1 - bbox.x0) / img.width) * this.canvas.width,
            h: ((bbox.y1 - bbox.y0) / img.height) * this.canvas.height
        };
    }

    applyBlurring() {
        // Restore original image
        this.ctx.putImageData(this.originalImageData, 0, 0);
        
        // Apply blur to all detected regions
        const allRects = [...this.detectedRects, ...this.detectedFaces];
        
        allRects.forEach(rect => {
            this.blurRegion(rect);
        });
    }

    blurRegion(rect) {
        // Extract the region to be blurred
        const imageData = this.ctx.getImageData(rect.x, rect.y, rect.w, rect.h);
        const blurredData = this.applyGaussianBlur(imageData, this.blurStrength);
        
        // Put the blurred data back
        this.ctx.putImageData(blurredData, rect.x, rect.y);
        
        // Draw a red border around the blurred area
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        
        // Add a semi-transparent overlay
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    applyGaussianBlur(imageData, radius) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        
        // Simple box blur approximation (faster than true Gaussian)
        const boxSize = Math.max(1, Math.floor(radius / 3));
        
        for (let i = 0; i < 3; i++) { // Apply box blur multiple times
            this.boxBlur(data, width, height, boxSize);
        }
        
        return new ImageData(data, width, height);
    }

    boxBlur(data, width, height, radius) {
        const temp = new Uint8ClampedArray(data);
        
        // Horizontal pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0, count = 0;
                
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = Math.max(0, Math.min(width - 1, x + dx));
                    const idx = (y * width + nx) * 4;
                    r += temp[idx];
                    g += temp[idx + 1];
                    b += temp[idx + 2];
