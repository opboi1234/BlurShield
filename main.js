// Enhanced Auto-Privacy Screenshot Cleaner with Background Removal
class PrivacyScreenshotCleaner {
    constructor() {
        this.REMOVE_BG_API_KEY = 'qrRJ2vGXfgXkyvbnV1mnUyN6';
        this.initializeElements();
        this.initializeState();
        this.bindEvents();
        this.loadFaceApiModels();
        this.setupProgressRing();
    }

    initializeElements() {
        // File upload elements
        this.imageUpload = document.getElementById('imageUpload');
        this.uploadSection = document.getElementById('uploadSection');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.cameraBtn = document.getElementById('cameraBtn');
        
        // Background removal elements
        this.bgRemoveFloatBtn = document.getElementById('bgRemoveFloatBtn');
        this.bgRemoveModal = document.getElementById('bgRemoveModal');
        this.closeBgModal = document.getElementById('closeBgModal');
        this.bgRemoveUpload = document.getElementById('bgRemoveUpload');
        this.bgImageUpload = document.getElementById('bgImageUpload');
        this.removeBgBtn = document.getElementById('removeBgBtn');
        this.bgResultContainer = document.getElementById('bgResultContainer');
        this.originalBgImage = document.getElementById('originalBgImage');
        this.processedBgImage = document.getElementById('processedBgImage');
        this.bgDownloadSection = document.getElementById('bgDownloadSection');
        this.downloadBgBtn = document.getElementById('downloadBgBtn');
        this.resetBgBtn = document.getElementById('resetBgBtn');
        this.bgLoadingOverlay = document.getElementById('bgLoadingOverlay');
        
        // Canvas elements
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.beforeCanvas = document.getElementById('beforeCanvas');
        this.beforeCtx = this.beforeCanvas?.getContext('2d');
        this.afterCanvas = document.getElementById('afterCanvas');
        this.afterCtx = this.afterCanvas?.getContext('2d');
        
        // Control elements
        this.blurSlider = document.getElementById('blurSlider');
        this.blurValue = document.getElementById('blurValue');
        this.blurPreview = document.getElementById('blurPreview');
        this.blurStyle = document.getElementById('blurStyle');
        
        // Loading elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.loadingSubtext = document.getElementById('loadingSubtext');
        this.progressCircle = document.getElementById('progressCircle');
        
        // Button elements
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Display elements
        this.placeholder = document.getElementById('placeholder');
        this.detectionStats = document.getElementById('detectionStats');
        this.detectedItemsList = document.getElementById('detectedItemsList');
        this.detectedItemsContent = document.getElementById('detectedItemsContent');
        this.beforeAfterContainer = document.getElementById('beforeAfterContainer');
        this.beforeAfterMode = document.getElementById('beforeAfterMode');
        
        // Detection checkboxes
        this.blurNameCheck = document.getElementById('blurNameCheck');
        this.userNameInput = document.getElementById('userNameInput');
        this.detectCustom = document.getElementById('detectCustom');
        this.customTextInput = document.getElementById('customTextInput');
        this.detectEmails = document.getElementById('detectEmails');
        this.detectPhones = document.getElementById('detectPhones');
        this.detectFaces = document.getElementById('detectFaces');
        this.detectAddresses = document.getElementById('detectAddresses');
        this.detectCreditCards = document.getElementById('detectCreditCards');
        this.detectSSN = document.getElementById('detectSSN');
        
        // Stats elements
        this.textDetections = document.getElementById('textDetections');
        this.faceDetections = document.getElementById('faceDetections');
        this.totalDetections = document.getElementById('totalDetections');
        this.processingTime = document.getElementById('processingTime');
    }

    initializeState() {
        this.originalImage = null;
        this.originalImageData = null;
        this.detectedRects = [];
        this.detectedFaces = [];
        this.detectedItems = [];
        this.undoStack = [];
        this.blurStrength = parseInt(this.blurSlider?.value || 15);
        this.userName = '';
        this.customText = '';
        this.faceApiLoaded = false;
        this.startTime = null;
        this.bgCurrentImage = null;
        this.bgProcessedImage = null;
        this.updateBlurPreview();
    }

    setupProgressRing() {
        const circle = this.progressCircle;
        if (circle) {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = circumference;
        }
    }

    updateProgressRing(percent) {
        const circle = this.progressCircle;
        if (circle) {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            const offset = circumference - (percent / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
    }

    bindEvents() {
        // File upload events
        if (this.imageUpload) {
            this.imageUpload.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        if (this.uploadSection) {
            this.uploadSection.addEventListener('click', () => this.imageUpload?.click());
            this.uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
            this.uploadSection.addEventListener('dragleave', () => this.uploadSection.classList.remove('dragover'));
        }

        // Background removal events
        if (this.bgRemoveFloatBtn) {
            this.bgRemoveFloatBtn.addEventListener('click', () => this.openBgRemoveModal());
        }
        if (this.closeBgModal) {
            this.closeBgModal.addEventListener('click', () => this.closeBgRemoveModal());
        }
        if (this.bgRemoveModal) {
            this.bgRemoveModal.addEventListener('click', (e) => {
                if (e.target === this.bgRemoveModal) this.closeBgRemoveModal();
            });
        }
        if (this.bgRemoveUpload) {
            this.bgRemoveUpload.addEventListener('click', () => this.bgImageUpload?.click());
            this.bgRemoveUpload.addEventListener('dragover', (e) => this.handleBgDragOver(e));
            this.bgRemoveUpload.addEventListener('drop', (e) => this.handleBgDrop(e));
            this.bgRemoveUpload.addEventListener('dragleave', () => this.bgRemoveUpload.classList.remove('dragover'));
        }
        if (this.bgImageUpload) {
            this.bgImageUpload.addEventListener('change', (e) => this.handleBgFileSelect(e));
        }
        if (this.removeBgBtn) {
            this.removeBgBtn.addEventListener('click', () => this.removeBackground());
        }
        if (this.downloadBgBtn) {
            this.downloadBgBtn.addEventListener('click', () => this.downloadBgResult());
        }
        if (this.resetBgBtn) {
            this.resetBgBtn.addEventListener('click', () => this.resetBgRemover());
        }

        // New feature events
        if (this.pasteBtn) {
            this.pasteBtn.addEventListener('click', () => this.handlePasteFromClipboard());
        }
        if (this.cameraBtn) {
            this.cameraBtn.addEventListener('click', () => this.handleCameraCapture());
        }
        if (this.beforeAfterMode) {
            this.beforeAfterMode.addEventListener('change', (e) => this.toggleBeforeAfterMode(e.target.checked));
        }

        // Control events
        if (this.blurSlider) {
            this.blurSlider.addEventListener('input', (e) => this.handleBlurChange(e));
        }
        if (this.blurStyle) {
            this.blurStyle.addEventListener('change', () => this.reprocessImage());
        }
        if (this.blurNameCheck) {
            this.blurNameCheck.addEventListener('change', (e) => this.handleNameBlurToggle(e));
        }
        if (this.userNameInput) {
            this.userNameInput.addEventListener('input', (e) => this.handleNameInput(e));
        }
        if (this.detectCustom) {
            this.detectCustom.addEventListener('change', (e) => this.handleCustomTextToggle(e));
        }
        if (this.customTextInput) {
            this.customTextInput.addEventListener('input', (e) => this.handleCustomTextInput(e));
        }
        
        // Detection setting changes
        [this.detectEmails, this.detectPhones, this.detectFaces, this.detectAddresses, 
         this.detectCreditCards, this.detectSSN].forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', () => this.reprocessImage());
            }
        });

        // Button events
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadImage());
        }
        if (this.downloadOriginalBtn) {
            this.downloadOriginalBtn.addEventListener('click', () => this.downloadOriginalImage());
        }
        if (this.undoBtn) {
            this.undoBtn.addEventListener('click', () => this.undoLastAction());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetAll());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // Background Removal Methods
    openBgRemoveModal() {
        if (this.bgRemoveModal) {
            this.bgRemoveModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeBgRemoveModal() {
        if (this.bgRemoveModal) {
            this.bgRemoveModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    handleBgDragOver(e) {
        e.preventDefault();
        this.bgRemoveUpload?.classList.add('dragover');
    }

    handleBgDrop(e) {
        e.preventDefault();
        this.bgRemoveUpload?.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processBgFile(files[0]);
        }
    }

    handleBgFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processBgFile(file);
        }
    }

    processBgFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file', 'error');
            return;
        }

        if (file.size > 12 * 1024 * 1024) {
            this.showToast('File size must be less than 12MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.bgCurrentImage = e.target.result;
            if (this.originalBgImage) {
                this.originalBgImage.src = this.bgCurrentImage;
            }
            if (this.removeBgBtn) {
                this.removeBgBtn.disabled = false;
            }
            this.showToast('Image loaded! Click "Remove Background" to process', 'success');
        };
        reader.readAsDataURL(file);
    }

    async removeBackground() {
        if (!this.bgCurrentImage) {
            this.showToast('Please select an image first', 'error');
            return;
        }

        if (this.bgLoadingOverlay) {
            this.bgLoadingOverlay.style.display = 'flex';
        }
        if (this.removeBgBtn) {
            this.removeBgBtn.disabled = true;
        }

        try {
            // Convert data URL to blob
            const response = await fetch(this.bgCurrentImage);
            const blob = await response.blob();

            // Create FormData
            const formData = new FormData();
            formData.append('image_file', blob);
            formData.append('size', 'auto');

            // Call remove.bg API
            const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: {
                    'X-Api-Key': this.REMOVE_BG_API_KEY,
                },
                body: formData
            });

            if (!apiResponse.ok) {
                throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}`);
            }

            const resultBlob = await apiResponse.blob();
            const resultUrl = URL.createObjectURL(resultBlob);
            
            this.bgProcessedImage = resultUrl;
            if (this.processedBgImage) {
                this.processedBgImage.src = resultUrl;
            }
            
            if (this.bgResultContainer) {
                this.bgResultContainer.style.display = 'grid';
            }
            if (this.bgDownloadSection) {
                this.bgDownloadSection.style.display = 'block';
            }
            
            this.showToast('Background removed successfully!', 'success');

        } catch (error) {
            console.error('Background removal error:', error);
            this.showToast('Failed to remove background. Please try again.', 'error');
        } finally {
            if (this.bgLoadingOverlay) {
                this.bgLoadingOverlay.style.display = 'none';
            }
            if (this.removeBgBtn) {
                this.removeBgBtn.disabled = false;
            }
        }
    }

    downloadBgResult() {
        if (!this.bgProcessedImage) {
            this.showToast('No processed image to download', 'error');
            return;
        }

        const link = document.createElement('a');
        link.href = this.bgProcessedImage;
        link.download = `background-removed-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Image downloaded successfully!', 'success');
    }

    resetBgRemover() {
        this.bgCurrentImage = null;
        this.bgProcessedImage = null;
        if (this.originalBgImage) this.originalBgImage.src = '';
        if (this.processedBgImage) this.processedBgImage.src = '';
        if (this.bgResultContainer) this.bgResultContainer.style.display = 'none';
        if (this.bgDownloadSection) this.bgDownloadSection.style.display = 'none';
        if (this.removeBgBtn) this.removeBgBtn.disabled = true;
        if (this.bgImageUpload) this.bgImageUpload.value = '';
        this.showToast('Background remover reset', 'info');
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'v':
                    if (e.target.tagName !== 'INPUT') {
                        e.preventDefault();
                        this.handlePasteFromClipboard();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    if (this.originalImage) {
                        this.downloadImage();
                    }
                    break;
                case 'z':
                    e.preventDefault();
                    this.undoLastAction();
                    break;
                case 'r':
                    e.preventDefault();
                    this.resetAll();
                    break;
            }
        }
        
        // ESC to close modal
        if (e.key === 'Escape') {
            this.closeBgRemoveModal();
        }
    }

    async handlePasteFromClipboard() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        const file = new File([blob], 'pasted-image.png', { type });
                        this.processFile(file);
                        this.showToast('Image pasted from clipboard!', 'success');
                        return;
                    }
                }
            }
            this.showToast('No image found in clipboard', 'warning');
        } catch (error) {
            this.showToast('Failed to access clipboard. Please use the upload button instead.', 'error');
        }
    }

    async handleCameraCapture() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            
            // Create camera modal
            const modal = this.createCameraModal(video, stream);
            document.body.appendChild(modal);
            
        } catch (error) {
            this.showToast('Camera access denied or not available', 'error');
        }
    }

    createCameraModal(video, stream) {
        const modal = document.createElement('div');
        modal.className = 'bg-remove-modal show';
        modal.innerHTML = `
            <div class="bg-remove-content">
                <button class="close-modal">
                    <i class="bi bi-x"></i>
                </button>
                <div class="bg-remove-header">
                    <h2><i class="bi bi-camera"></i> Camera Capture</h2>
                    <p>Position your camera and click capture when ready</p>
                </div>
                <div style="text-align: center; margin-bottom: 20px;">
                    <video style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);" autoplay></video>
                </div>
                <div class="text-center">
                    <button class="bg-remove-btn">
                        <i class="bi bi-camera"></i> Capture Photo
                    </button>
                </div>
            </div>
        `;
        
        modal.querySelector('video').srcObject = stream;
        modal.querySelector('.close-modal').addEventListener('click', () => {
            stream.getTracks().forEach(track => track.stop());
            modal.remove();
        });
        
        modal.querySelector('.bg-remove-btn').addEventListener('click', () => {
            this.capturePhotoFromVideo(video, stream, modal);
        });
        
        return modal;
    }

    capturePhotoFromVideo(video, stream, modal) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            const file = new File([blob], 'camera-capture.png', { type: 'image/png' });
            this.processFile(file);
            stream.getTracks().forEach(track => track.stop());
            modal.remove();
            this.showToast('Photo captured successfully!', 'success');
        });
    }

    toggleBeforeAfterMode(enabled) {
        if (this.beforeAfterContainer) {
            this.beforeAfterContainer.style.display = enabled ? 'grid' : 'none';
        }
        if (enabled && this.originalImage) {
            this.updateBeforeAfterView();
        }
    }

    updateBeforeAfterView() {
        if (!this.beforeCanvas || !this.afterCanvas) return;
        
        // Before (original)
        this.beforeCanvas.width = this.canvas.width;
        this.beforeCanvas.height = this.canvas.height;
        this.beforeCtx.putImageData(this.originalImageData, 0, 0);
        
        // After (processed)
        this.afterCanvas.width = this.canvas.width;
        this.afterCanvas.height = this.canvas.height;
        this.afterCtx.drawImage(this.canvas, 0, 0);
    }

    handleBlurChange(e) {
        this.blurStrength = parseInt(e.target.value);
        if (this.blurValue) {
            this.blurValue.textContent = this.blurStrength;
        }
        this.updateBlurPreview();
        
        if (this.originalImage) {
            this.reprocessImage();
        }
    }

    updateBlurPreview() {
        if (!this.blurPreview || !this.blurStyle) return;
        
        const style = this.blurStyle.value;
        switch(style) {
            case 'gaussian':
                this.blurPreview.style.filter = `blur(${Math.min(this.blurStrength/3, 10)}px)`;
                this.blurPreview.style.background = '#f3f4f6';
                this.blurPreview.style.color = '#374151';
                break;
            case 'pixelate':
                this.blurPreview.style.filter = 'none';
                this.blurPreview.style.background = `repeating-conic-gradient(#f3f4f6 0% 25%, #e5e7eb 25% 50%) 0 0/8px 8px`;
                this.blurPreview.style.color = '#374151';
                break;
            case 'blackout':
                this.blurPreview.style.filter = 'none';
                this.blurPreview.style.background = '#000000';
                this.blurPreview.style.color = '#000000';
                break;
        }
    }

    handleNameBlurToggle(e) {
        if (this.userNameInput) {
            this.userNameInput.style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) {
                this.userNameInput.focus();
            } else {
                this.userName = '';
                this.reprocessImage();
            }
        }
    }

    handleNameInput(e) {
        this.userName = e.target.value.trim();
        if (this.originalImage) {
            this.reprocessImage();
        }
    }

    handleCustomTextToggle(e) {
        if (this.customTextInput) {
            this.customTextInput.style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) {
                this.customTextInput.focus();
            } else {
                this.customText = '';
                this.reprocessImage();
            }
        }
    }

    handleCustomTextInput(e) {
        this.customText = e.target.value.trim();
        if (this.originalImage) {
            this.reprocessImage();
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadSection?.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadSection?.classList.remove('dragover');
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

        if (file.size > 10 * 1024 * 1024) {
            this.showToast('File size must be less than 10MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    loadImage(src) {
        const img = new Image();
        img.onload = () => {
            this.originalImage = img;
            this.setupCanvas(img);
            this.processImage();
            this.showButtons();
            this.hideplaceholder();
        };
        img.src = src;
    }

    setupCanvas(img) {
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(img, 0, 0, width, height);
        
        this.originalImageData = this.ctx.getImageData(0, 0, width, height);
    }

    hideplaceholder() {
        if (this.placeholder) {
            this.placeholder.style.display = 'none';
        }
    }

    showButtons() {
        if (this.downloadBtn) this.downloadBtn.style.display = 'inline-block';
        if (this.downloadOriginalBtn) this.downloadOriginalBtn.style.display = 'inline-block';
        if (this.resetBtn) this.resetBtn.style.display = 'inline-block';
    }

    async processImage() {
        if (!this.originalImage) return;

        this.startTime = Date.now();
        this.showLoading('Analyzing image...', 'Detecting sensitive information');
        this.updateProgressRing(10);

        try {
            // Reset detection arrays
            this.detectedRects = [];
            this.detectedFaces = [];
            this.detectedItems = [];

            // OCR Text Detection
            this.updateProgressRing(30);
            await this.performOCR();

            // Face Detection
            this.updateProgressRing(60);
            if (this.detectFaces?.checked && this.faceApiLoaded) {
                await this.detectFacesInImage();
            }

            // Apply blurring
            this.updateProgressRing(80);
            this.applyBlurring();

            // Update UI
            this.updateProgressRing(100);
            this.updateStats();
            this.updateDetectedItemsList();
            
            if (this.beforeAfterMode?.checked) {
                this.updateBeforeAfterView();
            }

            this.hideLoading();
            
            const processingTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
            if (this.processingTime) {
                this.processingTime.textContent = processingTime;
            }
            
            this.showToast(`Processing completed in ${processingTime}s`, 'success');

        } catch (error) {
            console.error('Processing error:', error);
            this.hideLoading();
            this.showToast('Error processing image. Please try again.', 'error');
        }
    }

    async performOCR() {
        try {
            const result = await Tesseract.recognize(this.canvas, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        this.updateProgressRing(30 + (m.progress * 30));
                    }
                }
            });

            this.analyzeOCRResults(result.data);
        } catch (error) {
            console.error('OCR Error:', error);
        }
    }

    analyzeOCRResults(data) {
        const patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
            ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
            creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
            address: /\b\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi
        };

        data.words.forEach(word => {
            const text = word.text;
            const bbox = word.bbox;

            // Check each pattern
            Object.entries(patterns).forEach(([type, pattern]) => {
                const checkboxName = `detect${type.charAt(0).toUpperCase() + type.slice(1)}s`;
                if (this[checkboxName]?.checked) {
                    if (pattern.test(text)) {
                        this.addDetectedRect(bbox, type, text);
                    }
                }
            });

            // Check custom name
            if (this.blurNameCheck?.checked && this.userName && 
                text.toLowerCase().includes(this.userName.toLowerCase())) {
                this.addDetectedRect(bbox, 'name', text);
            }

            // Check custom text
            if (this.detectCustom?.checked && this.customText && 
                text.toLowerCase().includes(this.customText.toLowerCase())) {
                this.addDetectedRect(bbox, 'custom', text);
            }
        });
    }

    addDetectedRect(bbox, type, text) {
        const rect = {
            x: bbox.x0,
            y: bbox.y0,
            width: bbox.x1 - bbox.x0,
            height: bbox.y1 - bbox.y0,
            type: type,
            text: text
        };
        
        this.detectedRects.push(rect);
        this.detectedItems.push({ type, text, method: 'OCR' });
    }

    async loadFaceApiModels() {
        try {
            if (typeof faceapi !== 'undefined') {
                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                this.faceApiLoaded = true;
                console.log('Face-API models loaded successfully');
            }
        } catch (
