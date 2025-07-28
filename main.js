// BlurShield main.js - Optimized Edition
class BlurShieldApp {
    constructor() {
        this.initElements();
        this.initState();
        this.bindEvents();
        this.renderBlurPreview();
        this.setTheme();
        
        // Lazy load heavy dependencies
        this.tesseractWorker = null;
        this.faceApiLoaded = false;
    }

    initElements() {
        // Cache DOM elements for better performance
        this.elements = {
            // Upload
            imageUpload: document.getElementById('imageUpload'),
            uploadSection: document.getElementById('uploadSection'),
            uploadProgress: document.getElementById('uploadProgress'),
            uploadProgressBar: document.getElementById('uploadProgressBar'),
            browseBtn: document.getElementById('browseBtn'),
            pasteBtn: document.getElementById('pasteBtn'),
            cameraBtn: document.getElementById('cameraBtn'),

            // Canvas
            canvas: document.getElementById('canvas'),
            placeholder: document.getElementById('placeholder'),
            beforeCanvas: document.getElementById('beforeCanvas'),
            afterCanvas: document.getElementById('afterCanvas'),
            beforeAfterContainer: document.getElementById('beforeAfterContainer'),
            beforeAfterMode: document.getElementById('beforeAfterMode'),

            // Controls
            blurSlider: document.getElementById('blurSlider'),
            blurValue: document.getElementById('blurValue'),
            blurPreviewSample: document.getElementById('blurPreviewSample'),
            blurStyle: document.getElementById('blurStyle'),

            // Loading
            loadingOverlay: document.getElementById('loadingOverlay'),
            loadingText: document.getElementById('loadingText'),
            loadingSubtext: document.getElementById('loadingSubtext'),

            // Buttons
            downloadBtn: document.getElementById('downloadBtn'),
            downloadOriginalBtn: document.getElementById('downloadOriginalBtn'),
            undoBtn: document.getElementById('undoBtn'),
            resetBtn: document.getElementById('resetBtn'),

            // Detection
            detectionStats: document.getElementById('detectionStats'),
            detectedItemsList: document.getElementById('detectedItemsList'),
            detectedItemsContent: document.getElementById('detectedItemsContent'),

            // Settings
            blurNameCheck: document.getElementById('blurNameCheck'),
            userNameInput: document.getElementById('userNameInput'),
            detectCustom: document.getElementById('detectCustom'),
            customTextInput: document.getElementById('customTextInput'),
            detectEmails: document.getElementById('detectEmails'),
            detectPhones: document.getElementById('detectPhones'),
            detectFaces: document.getElementById('detectFaces'),
            detectAddresses: document.getElementById('detectAddresses'),
            detectCreditCards: document.getElementById('detectCreditCards'),
            detectSSN: document.getElementById('detectSSN'),

            // Stats
            textDetections: document.getElementById('textDetections'),
            faceDetections: document.getElementById('faceDetections'),
            totalDetections: document.getElementById('totalDetections'),
            processingTime: document.getElementById('processingTime'),

            // Theme
            themeToggle: document.getElementById('themeToggle')
        };

        // Get canvas contexts
        this.ctx = this.elements.canvas.getContext('2d');
        this.beforeCtx = this.elements.beforeCanvas?.getContext('2d');
        this.afterCtx = this.elements.afterCanvas?.getContext('2d');
    }

    initState() {
        this.originalImage = null;
        this.originalImageData = null;
        this.detectedRects = [];
        this.detectedFaces = [];
        this.detectedItems = [];
        this.undoStack = [];
        this.blurStrength = parseInt(this.elements.blurSlider.value);
        this.userName = '';
        this.customText = '';
        this.startTime = null;
        this.processingQueue = [];
        this.isProcessing = false;
    }

    bindEvents() {
        const { elements } = this;

        // Upload events with debouncing
        elements.imageUpload.addEventListener('change', this.debounce(e => this.handleFileSelect(e), 100));
        
        elements.uploadSection.addEventListener('click', e => {
            if (e.target === elements.uploadSection) elements.imageUpload.click();
        });

        // Drag and drop with better UX
        elements.uploadSection.addEventListener('dragover', e => {
            e.preventDefault();
            elements.uploadSection.classList.add('dragover');
        });

        elements.uploadSection.addEventListener('dragleave', e => {
            if (!elements.uploadSection.contains(e.relatedTarget)) {
                elements.uploadSection.classList.remove('dragover');
            }
        });

        elements.uploadSection.addEventListener('drop', e => {
            e.preventDefault();
            elements.uploadSection.classList.remove('dragover');
            const file = e.dataTransfer.files?.[0];
            if (file) this.simulateProgressAndLoad(file);
        });

        // Quick actions
        elements.browseBtn.onclick = () => elements.imageUpload.click();
        elements.pasteBtn.onclick = () => this.handlePasteFromClipboard();
        elements.cameraBtn.onclick = () => this.handleCameraCapture();

        // Controls with throttling for better performance
        elements.blurSlider.addEventListener('input', this.throttle(e => this.handleBlurChange(e), 50));
        elements.blurStyle.addEventListener('change', this.debounce(() => this.reprocessImage(), 200));

        // Personal information settings
        elements.blurNameCheck.addEventListener('change', e => {
            elements.userNameInput.style.display = e.target.checked ? 'block' : 'none';
            this.reprocessImage();
        });

        elements.userNameInput.addEventListener('input', this.debounce(e => {
            this.userName = e.target.value || '';
            this.reprocessImage();
        }, 300));

        elements.detectCustom.addEventListener('change', e => {
            elements.customTextInput.style.display = e.target.checked ? 'block' : 'none';
            this.reprocessImage();
        });

        elements.customTextInput.addEventListener('input', this.debounce(e => {
            this.customText = e.target.value || '';
            this.reprocessImage();
        }, 300));

        // Detection settings
        [elements.detectEmails, elements.detectPhones, elements.detectFaces, 
         elements.detectAddresses, elements.detectCreditCards, elements.detectSSN].forEach(checkbox => {
            checkbox.addEventListener('change', this.debounce(() => this.reprocessImage(), 200));
        });

        // Buttons
        elements.downloadBtn.onclick = () => this.downloadImage();
        elements.downloadOriginalBtn.onclick = () => this.downloadOriginalImage();
        elements.undoBtn.onclick = () => this.undoLastAction();
        elements.resetBtn.onclick = () => this.resetAll();

        // Before/after mode
        elements.beforeAfterMode.addEventListener('change', e => this.toggleBeforeAfterMode(e.target.checked));

        // Theme toggle
        elements.themeToggle.onclick = () => this.toggleTheme();

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'z':
                        e.preventDefault();
                        this.undoLastAction();
                        break;
                    case 's':
                        e.preventDefault();
                        this.downloadImage();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetAll();
                        break;
                }
            }
        });
    }

    // Utility functions for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    setTheme() {
        // Auto dark mode detection
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
            this.elements.themeToggle.innerHTML = '<i class="bi bi-brightness-high"></i>';
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        this.elements.themeToggle.innerHTML = isDark ? 
            '<i class="bi bi-brightness-high"></i>' : 
            '<i class="bi bi-moon"></i>';
        
        // Save preference
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    simulateProgressAndLoad(file) {
        this.elements.uploadProgress.style.display = 'block';
        this.elements.uploadProgressBar.style.width = '0%';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 90) progress = 90;
            this.elements.uploadProgressBar.style.width = progress + '%';
        }, 100);

        // Start loading file immediately
        this.handleImageFile(file).then(() => {
            clearInterval(interval);
            this.elements.uploadProgressBar.style.width = '100%';
            setTimeout(() => {
                this.elements.uploadProgress.style.display = 'none';
            }, 500);
        });
    }

    async handleImageFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showToast('Invalid image file', 'danger');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.showToast('File too large. Maximum size is 10MB', 'danger');
            return;
        }

        try {
            const dataURL = await this.fileToDataURL(file);
            await this.loadImage(dataURL);
        } catch (error) {
            this.showToast('Error loading image: ' + error.message, 'danger');
        }
    }

    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) this.simulateProgressAndLoad(file);
    }

    async loadImage(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Optimize canvas size for performance
                const maxSize = 1920;
                let { width, height } = img;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width *= ratio;
                    height *= ratio;
                }

                this.elements.canvas.width = width;
                this.elements.canvas.height = height;
                this.ctx.clearRect(0, 0, width, height);
                this.ctx.drawImage(img, 0, 0, width, height);

                this.originalImage = img;
                this.originalImageData = this.ctx.getImageData(0, 0, width, height);
                this.elements.placeholder.style.display = 'none';
                
                this.showButtons();
                this.reprocessImage();
                resolve();
            };
            img.onerror = reject;
            img.src = dataURL;
        });
    }

    async handlePasteFromClipboard() {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        await this.handleImageFile(blob);
                        return;
                    }
                }
            }
            this.showToast('No image found in clipboard!', 'warning');
        } catch (error) {
            this.showToast('Clipboard access denied', 'danger');
        }
    }

    handleCameraCapture() {
        // Create a temporary input for camera capture
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) this.simulateProgressAndLoad(file);
        };
        input.click();
    }

    renderBlurPreview() {
        this.elements.blurValue.textContent = this.elements.blurSlider.value;
        
        const canvas = this.elements.blurPreviewSample;
        const ctx = canvas.getContext('2d');
        
        // Clear and draw sample text
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#374151';
        ctx.fillText('Sample', 5, 14);
        
        // ApplytesseractWorker) {
                await window.loadTesseract();
                this.tesseractWorker = await Tesseract.createWorker();
                await this.tesseractWorker.loadLanguage('eng');
                await this.tesseractWorker.initialize('eng');
                await this.tesseractWorker.setParameters({
                    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@.-_+() ',
                    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT
                });
            }

            this.showLoading('Reading text...', 'OCR processing in progress');

            // Get image data for OCR
            const canvas = this.elements.canvas;
            const { data } = await this.tesseractWorker.recognize(canvas);

            // Process detected text
            this.processOCRResults(data);

        } catch (error) {
            console.error('OCR Error:', error);
            // Continue without OCR if it fails
        }
    }

    processOCRResults(data) {
        const { words } = data;
        
        words.forEach(word => {
            const text = word.text.trim();
            if (text.length < 2) return;

            const bbox = word.bbox;
            const rect = {
                x: bbox.x0,
                y: bbox.y0,
                width: bbox.x1 - bbox.x0,
                height: bbox.y1 - bbox.y0,
                text: text,
                type: 'unknown'
            };

            // Check against various patterns
            if (this.elements.detectEmails.checked && this.isEmail(text)) {
                rect.type = 'email';
                this.detectedRects.push(rect);
                this.detectedItems.push({ type: 'Email', text: this.maskText(text) });
            }
            
            if (this.elements.detectPhones.checked && this.isPhoneNumber(text)) {
                rect.type = 'phone';
                this.detectedRects.push(rect);
                this.detectedItems.push({ type: 'Phone', text: this.maskText(text) });
            }
            
            if (this.elements.detectCreditCards.checked && this.isCreditCard(text)) {
                rect.type = 'creditcard';
                this.detectedRects.push(rect);
                this.detectedItems.push({ type: 'Credit Card', text: this.maskText(text) });
            }
            
            if (this.elements.detectSSN.checked && this.isSSN(text)) {
                rect.type = 'ssn';
                this.detectedRects.push(rect);
                this.detectedItems.push({ type: 'SSN', text: this.maskText(text) });
            }
            
            if (this.elements.detectAddresses.checked && this.isAddress(text)) {
                rect.type = 'address';
                this.detectedRects.push(rect);
                this.detectedItems.push({ type: 'Address', text: this.maskText(text) });
            }
            
            if (this.elements.blurNameCheck.checked && this.userName && 
                text.toLowerCase().includes(this.userName.toLowerCase())) {
                rect.type = 'name';
                this.detectedRects.push(rect);
                this.detectedItems.push({ type: 'Name', text: this.maskText(text) });
            }
            
            if (this.elements.detectCustom.checked && this.customText && 
                text.toLowerCase().includes(this.customText.toLowerCase())) {
                rect.type = 'custom';
                this.detectedRects.push(rect);
                this.detectedItems.push({ type: 'Custom', text: this.maskText(text) });
            }
        });
    }

    async detectFaces() {
        try {
            // Lazy load face-api.js only when needed
            if (!this.faceApiLoaded) {
                await window.loadFaceAPI();
                await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/');
                this.faceApiLoaded = true;
            }

            this.showLoading('Detecting faces...', 'AI face recognition in progress');

            const detections = await faceapi.detectAllFaces(
                this.elements.canvas,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
            );

            detections.forEach((detection, index) => {
                const box = detection.box;
                const rect = {
                    x: box.x,
                    y: box.y,
                    width: box.width,
                    height: box.height,
                    type: 'face',
                    confidence: detection.score
                };
                
                this.detectedFaces.push(rect);
                this.detectedItems.push({ 
                    type: 'Face', 
                    text: `Face ${index + 1} (${Math.round(detection.score * 100)}% confidence)` 
                });
            });

        } catch (error) {
            console.error('Face detection error:', error);
            // Continue without face detection if it fails
        }
    }

    applyBlurEffects() {
        const style = this.elements.blurStyle.value;
        
        // Apply blur to text detections
        this.detectedRects.forEach(rect => {
            this.applyBlur(rect, style);
        });
        
        // Apply blur to face detections
        this.detectedFaces.forEach(rect => {
            this.applyBlur(rect, style);
        });
    }

    applyBlur(rect, style) {
        const { x, y, width, height } = rect;
        
        // Add padding to blur area
        const padding = 5;
        const blurX = Math.max(0, x - padding);
        const blurY = Math.max(0, y - padding);
        const blurWidth = Math.min(this.elements.canvas.width - blurX, width + padding * 2);
        const blurHeight = Math.min(this.elements.canvas.height - blurY, height + padding * 2);

        switch (style) {
            case 'gaussian':
                this.applyGaussianBlur(blurX, blurY, blurWidth, blurHeight);
                break;
            case 'pixelate':
                this.applyPixelate(blurX, blurY, blurWidth, blurHeight);
                break;
            case 'blackout':
                this.applyBlackout(blurX, blurY, blurWidth, blurHeight);
                break;
        }
    }

    applyGaussianBlur(x, y, width, height) {
        // Create temporary canvas for blur effect
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;

        // Copy region to temp canvas
        const imageData = this.ctx.getImageData(x, y, width, height);
        tempCtx.putImageData(imageData, 0, 0);

        // Apply blur filter
        tempCtx.filter = `blur(${this.blurStrength}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);

        // Draw blurred region back
        this.ctx.drawImage(tempCanvas, x, y);
    }

    applyPixelate(x, y, width, height) {
        const pixelSize = Math.max(8, this.blurStrength);
        const imageData = this.ctx.getImageData(x, y, width, height);
        const data = imageData.data;

        for (let py = 0; py < height; py += pixelSize) {
            for (let px = 0; px < width; px += pixelSize) {
                // Get average color of pixel block
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
                    for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                        const i = ((py + dy) * width + (px + dx)) * 4;
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }
                
                r = Math.floor(r / count);
                g = Math.floor(g
