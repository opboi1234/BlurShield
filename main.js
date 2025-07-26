// Enhanced Auto-Privacy Screenshot Cleaner
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
        
        // Checkboxes
        this.blurNameCheck = document.getElementById('blurNameCheck');
        this.userNameInput = document.getElementById('userNameInput');
        this.detectEmails = document.getElementById('detectEmails');
        this.detectPhones = document.getElementById('detectPhones');
        this.detectFaces = document.getElementById('detectFaces');
        this.detectAddresses = document.getElementById('detectAddresses');
        this.detectCreditCards = document.getElementById('detectCreditCards');
        
        // Stats
        this.textDetections = document.getElementById('textDetections');
        this.faceDetections = document.getElementById('faceDetections');
        this.totalDetections = document.getElementById('totalDetections');
    }

    initializeState() {
        this.originalImage = null;
        this.detectedRects = [];
        this.detectedFaces = [];
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
        [this.detectEmails, this.detectPhones, this.detectFaces, this.detectAddresses, this.detectCreditCards]
            .forEach(checkbox => checkbox.addEventListener('change', () => this.reprocessImage()));

        // Button events
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.resetBtn.addEventListener('click', () => this.resetAll());
    }

    async loadFaceApiModels() {
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
            this.faceApiLoaded = true;
        } catch (error) {
            console.warn('Face detection unavailable:', error);
            this.showToast('Face detection unavailable', 'warning');
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
        const maxWidth = 700;
        const maxHeight = 500;
        
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.display = 'block';
        this.placeholder.style.display = 'none';
    }

    async processImage(img) {
        this.showLoading(true, 'Analyzing image...');
        this.updateProgress(10);
        
        // Draw original image
        this.drawImage(img);
        
        // Reset detection arrays
        this.detectedRects = [];
        this.detectedFaces = [];

        try {
            // OCR Processing
            this.updateProgress(30);
            this.updateLoadingText('Detecting text...');
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
            await this.applyBlurring();
            
            this.updateProgress(100);
            this.showLoading(false);
            this.updateStats();
            this.showControls(true);
            this.showToast('Image processed successfully!', 'success');
            
        } catch (error) {
            console.error('Processing error:', error);
            this.showLoading(false);
            this.showToast('Error processing image', 'error');
        }
    }

    async performOCR(img) {
        const { data } = await Tesseract.recognize(img, 'eng', {
            logger: () => {} // Suppress logs
        });

        data.words.forEach(word => {
            const text = word.text.trim();
            if (!text) return;

            const bbox = word.bbox;
            if (this.isPrivateInfo(text)) {
                const rect = this.mapBboxToCanvas(bbox, img);
                this.detectedRects.push(rect);
            }
        });
    }

    async performFaceDetection(img) {
        if (!this.faceApiLoaded) return;

        const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
        
        detections.forEach(detection => {
            const box = detection.box;
            const rect = {
                x: (box.x / img.width) * this.canvas.width,
                y: (box.y / img.height) * this.canvas.height,
                w: (box.width / img.width) * this.canvas.width,
                h: (box.height / img.height) * this.canvas.height
            };
            this.detectedFaces.push(rect);
        });
    }

    mapBboxToCanvas(bbox, img) {
        return {
            x: (bbox.x0 / img.width) * this.canvas.width,
            y: (bbox.y0 / img.height) * this.canvas.height,
            w: ((bbox.x1 - bbox.x0) / img.width) * this.canvas.width,
            h: ((bbox.y1 - bbox.y0) / img.height) * this.canvas.height
        };
    }

    isPrivateInfo(text) {
        const patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
            phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,
            creditCard: /\b(?:\d[ -]*?){13,16}\b/,
            address: /\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)/i
        };

        if (this.detectEmails.checked && patterns.email.test(text)) return true;
        if (this.detectPhones.checked && patterns.phone.test(text)) return true;
        if (this.detectCreditCards.checked && patterns.creditCard.test(text)) return true;
        if (this.detectAddresses.checked && patterns.address.test(text)) return true;
        if (this.blurNameCheck.checked && this.userName && 
            text.toLowerCase().includes(this.userName.toLowerCase())) return true;

        return false;
    }

    async applyBlurring() {
        // Redraw original image
        this.drawImage(this.originalImage);
        
        // Apply blur to detected regions
        const allRects = [...this.detectedRects, ...this.detectedFaces];
        
        for (const rect of allRects) {
            await this.blurRegion(rect);
        }
    }

    async blurRegion(rect) {
        // Create temporary canvas for blurring
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = rect.w;
        tempCanvas.height = rect.h;
        
        // Extract region
        tempCtx.drawImage(this.canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
        
        // Apply blur
        tempCtx.filter = `blur(${this.blurStrength}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);
        
        // Draw blurred region back
        this.ctx.drawImage(tempCanvas, 0, 0, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
        
        // Draw border
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    drawImage(img) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
    }

    handleBlurChange(e) {
        this.blurStrength = parseInt(e.target.value);
        this.blurValue.textContent = this.blurStrength;
        this.updateBlurPreview();
        
        if (this.originalImage) {
            this.reprocessImage();
        }
    }

    updateBlurPreview() {
        this.blurPreview.style.filter = `blur(${Math.min(this.blurStrength / 4, 3)}px)`;
    }

    handleNameBlurToggle(e) {
        this.userNameInput.style.display = e.target.checked ? 'block' : 'none';
        if (!e.target.checked) {
            this.userNameInput.value = '';
            this.userName = '';
        }
        if (this.originalImage) {
            this.reprocessImage();
        }
    }

    handleNameInput(e) {
        this.userName = e.target.value.trim();
        if (this.originalImage) {
            this.reprocessImage();
        }
    }

    async reprocessImage() {
        if (this.originalImage) {
            await this.processImage(this.originalImage);
        }
    }

    updateStats() {
        const textCount = this.detectedRects.length;
        const faceCount = this.detectedFaces.length;
        const total = textCount + faceCount;

        this.textDetections.textContent = textCount;
        this.faceDetections.textContent = faceCount;
        this.totalDetections.textContent = total;
        
        this.detectionStats.style.display = total > 0 ? 'grid' : 'none';
    }

    showLoading(show, text = 'Processing...') {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
        if (show) {
            this.updateLoadingText(text);
            this.updateProgress(0);
        }
    }

    updateLoadingText(text) {
        this.loadingText.textContent = text;
    }

    updateProgress(percent) {
        this.progressBar.style.width = `${percent}%`;
    }

    showControls(show) {
        this.downloadBtn.style.display = show ? 'inline-block' : 'none';
        this.resetBtn.style.display = show ? 'inline-block' : 'none';
    }

    downloadImage() {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `privacy-cleaned-${timestamp}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        this.showToast('Image downloaded successfully!', 'success');
    }

    resetAll() {
        this.originalImage = null;
        this.detectedRects = [];
        this.detectedFaces = [];
        this.canvas.style.display = 'none';
        this.placeholder.style.display = 'block';
        this.showControls(false);
        this.detectionStats.style.display = 'none';
        this.imageUpload.value = '';
        this.userNameInput.value = '';
        this.userName = '';
        this.blurNameCheck.checked = false;
        this.userNameInput.style.display = 'none';
    }

    showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PrivacyScreenshotCleaner();
});
