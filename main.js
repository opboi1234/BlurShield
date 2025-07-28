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
        this.browseBtn = document.getElementById('browseBtn');
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
        this.uploadSection.addEventListener('click', (e) => {
            if (!e.target.closest('button')) this.imageUpload.click();
        });
        if (this.browseBtn) {
            this.browseBtn.addEventListener('click', () => this.imageUpload.click());
        }
        this.uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadSection.addEventListener('dragleave', () => this.uploadSection.classList.remove('dragover'));

        // Prevent default drag/drop on window to avoid browser navigation
        window.addEventListener('dragover', e => e.preventDefault());
        window.addEventListener('drop', e => e.preventDefault());

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
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        this.canvas.width = width * scale;
        this.canvas.height = height * scale;
        this.canvas.style.display = 'block';
        this.placeholder.style.display = 'none';
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

    drawImage(img) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(
            img,
            0, 0, img.width, img.height,
            0, 0, this.canvas.width, this.canvas.height
        );
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

            data.words.forEach(word => {
                if (!word.text || word.confidence < 30) return; // Skip low confidence words
                const text = word.text.trim();
                const bbox = word.bbox;
                const sensitiveType = this.getSensitiveType(text);
                if (sensitiveType) {
                    const rect = this.mapBboxToCanvas(bbox, img);
                    // Padding
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
                }
            });
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
               
