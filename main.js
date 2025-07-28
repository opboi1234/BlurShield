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
        this.blurNameCheck = document.getElementById('blurNameCheck');
        this.userNameInput = document.getElementById('userNameInput');
        this.detectEmails = document.getElementById('detectEmails');
        this.detectPhones = document.getElementById('detectPhones');
        this.detectFaces = document.getElementById('detectFaces');
        this.detectAddresses = document.getElementById('detectAddresses');
        this.detectCreditCards = document.getElementById('detectCreditCards');
        this.detectSSN = document.getElementById('detectSSN');
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
        window.addEventListener('dragover', e => e.preventDefault());
        window.addEventListener('drop', e => e.preventDefault());
        this.blurSlider.addEventListener('input', (e) => this.handleBlurChange(e));
        this.blurNameCheck.addEventListener('change', (e) => this.handleNameBlurToggle(e));
        this.userNameInput.addEventListener('input', (e) => this.handleNameInput(e));
        [this.detectEmails, this.detectPhones, this.detectFaces, this.detectAddresses, this.detectCreditCards, this.detectSSN]
            .forEach(checkbox => checkbox.addEventListener('change', () => this.reprocessImage()));
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.resetBtn.addEventListener('click', () => this.resetAll());
    }
    async loadFaceApiModels() {
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
            this.faceApiLoaded = true;
        } catch (error) {
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
        const maxSize = 10 * 1024 * 1024;
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
        const maxWidth = 800, maxHeight = 600;
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
        this.drawImage(img);
        this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.detectedRects = [];
        this.detectedFaces = [];
        this.detectedItems = [];
        try {
            this.updateProgress(30);
            this.updateLoadingText('Detecting text and sensitive information...');
            await this.performOCR(img);
            if (this.detectFaces.checked && this.faceApiLoaded) {
                this.updateProgress(70);
                this.updateLoadingText('Detecting faces...');
                await this.performFaceDetection(img);
            }
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
                if (!word.text || word.confidence < 30) return;
                const text = word.text.trim();
                const bbox = word.bbox;
                const sensitiveType = this.getSensitiveType(text);
                if (sensitiveType) {
                    const rect = this.mapBboxToCanvas(bbox, img);
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
            throw new Error('Failed to analyze text in image');
        }
    }
    getSensitiveType(text) {
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
            detections.forEach((detection, index) => {
                const box = detection.box;
                const rect = {
                    x: (box.x / img.width) * this.canvas.width,
                    y: (box.y / img.height) * this.canvas.height,
                    w: (box.width / img.width) * this.canvas.width,
                    h: (box.height / img.height) * this.canvas.height
                };
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
        } catch (error) {}
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
        this.ctx.putImageData(this.originalImageData, 0, 0);
        const allRects = [...this.detectedRects, ...this.detectedFaces];
        allRects.forEach(rect => { this.blurRegion(rect); });
    }
    blurRegion(rect) {
        const imageData = this.ctx.getImageData(rect.x, rect.y, rect.w, rect.h);
        const blurredData = this.applyGaussianBlur(imageData, this.blurStrength);
        this.ctx.putImageData(blurredData, rect.x, rect.y);
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    applyGaussianBlur(imageData, radius) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        const boxSize = Math.max(1, Math.floor(radius / 3));
        for (let i = 0; i < 3; i++) {
            this.boxBlur(data, width, height, boxSize);
        }
        return new ImageData(data, width, height);
    }
    boxBlur(data, width, height, radius) {
        const temp = new Uint8ClampedArray(data);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0, count = 0;
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = Math.max(0, Math.min(width - 1, x + dx));
                    const idx = (y * width + nx) * 4;
                    r += temp[idx]; g += temp[idx + 1]; b += temp[idx + 2]; a += temp[idx + 3]; count++;
                }
                const idx = (y * width + x) * 4;
                data[idx] = r / count;
                data[idx + 1] = g / count;
                data[idx + 2] = b / count;
                data[idx + 3] = a / count;
            }
        }
        temp.set(data);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0, count = 0;
                for (let dy = -radius; dy <= radius; dy++) {
                    const ny = Math.max(0, Math.min(height - 1, y + dy));
                    const idx = (ny * width + x) * 4;
                    r += temp[idx]; g += temp[idx + 1]; b += temp[idx + 2]; a += temp[idx + 3]; count++;
                }
                const idx = (y * width + x) * 4;
                data[idx] = r / count;
                data[idx + 1] = g / count;
                data[idx + 2] = b / count;
                data[idx + 3] = a / count;
            }
        }
    }
    handleBlurChange(e) {
        this.blurStrength = parseInt(this.blurSlider.value);
        this.blurValue.textContent = this.blurStrength;
        this.updateBlurPreview();
        if (this.originalImage) this.applyBlurring();
    }
    updateBlurPreview() {
        this.blurPreview.style.filter = `blur(${this.blurStrength}px)`;
    }
    handleNameBlurToggle(e) {
        if (this.blurNameCheck.checked) {
            this.userNameInput.style.display = '';
            this.userNameInput.focus();
        } else {
            this.userNameInput.style.display = 'none';
            this.userName = '';
            this.reprocessImage();
        }
    }
    handleNameInput(e) {
        this.userName = e.target.value.trim();
        this.reprocessImage();
    }
    reprocessImage() {
        if (!this.originalImage) return;
        this.processImage(this.originalImage);
    }
    showLoading(show, text = '') {
        this.loadingOverlay.style.display = show ? '' : 'none';
        if (text) this.loadingText.textContent = text;
    }
    updateLoadingText(text) {
        this.loadingText.textContent = text;
    }
    updateProgress(percent) {
        if (this.progressBar) this.progressBar.style.width = `${percent}%`;
    }
    showControls(show) {
        this.downloadBtn.style.display = show ? '' : 'none';
        this.resetBtn.style.display = show ? '' : 'none';
    }
    resetAll() {
        this.originalImage = null;
        this.originalImageData = null;
        this.detectedRects = [];
        this.detectedFaces = [];
        this.detectedItems = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.style.display = 'none';
        this.placeholder.style.display = '';
        this.showControls(false);
        this.detectionStats.style.display = 'none';
        this.detectedItemsList.style.display = 'none';
        this.userNameInput.value = '';
        this.userNameInput.style.display = 'none';
        this.blurNameCheck.checked = false;
    }
    updateStats() {
        this.textDetections.textContent = this.detectedRects.length;
        this.faceDetections.textContent = this.detectedFaces.length;
        const total = this.detectedRects.length + this.detectedFaces.length;
        this.totalDetections.textContent = total;
        this.detectionStats.style.display = '';
    }
    updateDetectedItemsList() {
        if (!this.detectedItems.length) {
            this.detectedItemsList.style.display = 'none';
            this.detectedItemsContent.innerHTML = '';
            return;
        }
        this.detectedItemsList.style.display = '';
        this.detectedItemsContent.innerHTML = this.detectedItems.map(item =>
            `<span class="detected-item">${item.type.toUpperCase()}: ${item.text}</span>`
        ).join(' ');
    }
    downloadImage() {
        const link = document.createElement('a');
        link.download = 'cleaned-image.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} border-0 show`;
        toast.role = 'alert';
        toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div></div>`;
        document.querySelector('.toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}
window.addEventListener('DOMContentLoaded', () => new PrivacyScreenshotCleaner());
