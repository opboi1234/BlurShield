// BlurShield main.js – Hackathon Edition

class BlurShieldApp {
    constructor() {
        this.initElements();
        this.initState();
        this.bindEvents();
        this.loadFaceApiModels();
        this.renderBlurPreview();
        this.setTheme();
        this.renderLottie();
    }

    initElements() {
        // Upload
        this.imageUpload = document.getElementById('imageUpload');
        this.uploadSection = document.getElementById('uploadSection');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.uploadProgressBar = document.getElementById('uploadProgressBar');
        this.browseBtn = document.getElementById('browseBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.cameraBtn = document.getElementById('cameraBtn');
        // Canvas
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.placeholder = document.getElementById('placeholder');
        this.beforeCanvas = document.getElementById('beforeCanvas');
        this.beforeCtx = this.beforeCanvas?.getContext('2d');
        this.afterCanvas = document.getElementById('afterCanvas');
        this.afterCtx = this.afterCanvas?.getContext('2d');
        this.beforeAfterContainer = document.getElementById('beforeAfterContainer');
        this.beforeAfterMode = document.getElementById('beforeAfterMode');
        // Controls
        this.blurSlider = document.getElementById('blurSlider');
        this.blurValue = document.getElementById('blurValue');
        this.blurPreview = document.getElementById('blurPreview');
        this.blurPreviewSample = document.getElementById('blurPreviewSample');
        this.blurStyle = document.getElementById('blurStyle');
        // Loading
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.loadingSubtext = document.getElementById('loadingSubtext');
        // Buttons
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.resetBtn = document.getElementById('resetBtn');
        // Detection
        this.detectionStats = document.getElementById('detectionStats');
        this.detectedItemsList = document.getElementById('detectedItemsList');
        this.detectedItemsContent = document.getElementById('detectedItemsContent');
        // Detection settings
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
        // Stats
        this.textDetections = document.getElementById('textDetections');
        this.faceDetections = document.getElementById('faceDetections');
        this.totalDetections = document.getElementById('totalDetections');
        this.processingTime = document.getElementById('processingTime');
        // Theme
        this.themeToggle = document.getElementById('themeToggle');
    }

    initState() {
        this.originalImage = null;
        this.originalImageData = null;
        this.detectedRects = [];
        this.detectedFaces = [];
        this.detectedItems = [];
        this.undoStack = [];
        this.blurStrength = parseInt(this.blurSlider.value);
        this.userName = '';
        this.customText = '';
        this.faceApiLoaded = false;
        this.startTime = null;
    }

    bindEvents() {
        // Upload events
        this.imageUpload.addEventListener('change', e => this.handleFileSelect(e));
        this.uploadSection.addEventListener('click', e => {
            if (e.target === this.uploadSection) this.imageUpload.click();
        });
        this.uploadSection.addEventListener('dragover', e => {
            e.preventDefault(); this.uploadSection.classList.add('dragover');
        });
        this.uploadSection.addEventListener('dragleave', e => {
            this.uploadSection.classList.remove('dragover');
        });
        this.uploadSection.addEventListener('drop', e => {
            e.preventDefault();
            this.uploadSection.classList.remove('dragover');
            const file = e.dataTransfer.files?.[0];
            if (file) this.simulateProgressAndLoad(file);
        });
        this.browseBtn.onclick = () => this.imageUpload.click();
        // Progress bar simulation for fun
        this.imageUpload.addEventListener('change', e => {
            if (e.target.files[0]) this.simulateProgressAndLoad(e.target.files[0]);
        });
        // Paste/camera
        this.pasteBtn.onclick = () => this.handlePasteFromClipboard();
        this.cameraBtn.onclick = () => this.handleCameraCapture();
        // Controls
        this.blurSlider.addEventListener('input', e => this.handleBlurChange(e));
        this.blurStyle.addEventListener('change', () => this.reprocessImage());
        this.blurNameCheck.addEventListener('change', e => {
            this.userNameInput.style.display = e.target.checked ? '' : 'none';
            this.reprocessImage();
        });
        this.userNameInput.addEventListener('input', e => {
            this.userName = e.target.value || '';
            this.reprocessImage();
        });
        this.detectCustom.addEventListener('change', e => {
            this.customTextInput.style.display = e.target.checked ? '' : 'none';
            this.reprocessImage();
        });
        this.customTextInput.addEventListener('input', e => {
            this.customText = e.target.value || '';
            this.reprocessImage();
        });
        [this.detectEmails, this.detectPhones, this.detectFaces, this.detectAddresses,
        this.detectCreditCards, this.detectSSN].forEach(checkbox =>
            checkbox.addEventListener('change', () => this.reprocessImage())
        );
        // Buttons
        this.downloadBtn.onclick = () => this.downloadImage();
        this.downloadOriginalBtn.onclick = () => this.downloadOriginalImage();
        this.undoBtn.onclick = () => this.undoLastAction();
        this.resetBtn.onclick = () => this.resetAll();
        // Before/after
        this.beforeAfterMode.addEventListener('change', e =>
            this.toggleBeforeAfterMode(e.target.checked)
        );
        // Theme
        this.themeToggle.onclick = () => this.toggleTheme();
    }

    renderLottie() {
        if (window.lottie) {
            window.lottie.loadAnimation({
                container: document.getElementById('lottieLoader'),
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'https://assets6.lottiefiles.com/packages/lf20_mbfqwwtq.json'
            });
        }
    }
    setTheme() {
        // Auto dark if user prefers
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        }
    }
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        this.themeToggle.innerHTML =
            document.body.classList.contains('dark-theme')
                ? '<i class="bi bi-brightness-high"></i>'
                : '<i class="bi bi-moon"></i>';
    }

    simulateProgressAndLoad(file) {
        this.uploadProgress.style.display = 'block';
        this.uploadProgressBar.style.width = '0%';
        let prog = 0;
        const interval = setInterval(() => {
            prog += 15; this.uploadProgressBar.style.width = prog + '%';
            if (prog >= 100) { clearInterval(interval); this.uploadProgressBar.style.width = '100%'; }
        }, 50);
        setTimeout(() => {
            this.uploadProgress.style.display = 'none';
            this.handleImageFile(file);
        }, 550);
    }

    handleImageFile(file) {
        if (!file || !file.type.startsWith('image/')) return this.showToast('Invalid image file', 'danger');
        const reader = new FileReader();
        reader.onload = e => {
            this.loadImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) this.simulateProgressAndLoad(file);
    }

    loadImage(dataURL) {
        const img = new window.Image();
        img.onload = () => {
            this.canvas.width = img.width; this.canvas.height = img.height;
            this.ctx.clearRect(0, 0, img.width, img.height);
            this.ctx.drawImage(img, 0, 0);
            this.originalImage = img;
            this.originalImageData = this.ctx.getImageData(0, 0, img.width, img.height);
            this.placeholder.style.display = 'none';
            this.reprocessImage();
        };
        img.src = dataURL;
    }

    handlePasteFromClipboard() {
        navigator.clipboard.read().then(items => {
            for (const item of items) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        item.getType(type).then(blob => this.handleImageFile(blob));
                        return;
                    }
                }
            }
            this.showToast('No image found in clipboard!', 'danger');
        });
    }

    handleCameraCapture() {
        // Fallback: use input type capture?
        this.imageUpload.setAttribute('capture', 'environment');
        this.imageUpload.click();
    }

    renderBlurPreview() {
        this.blurValue.textContent = this.blurSlider.value;
        const ctxPrev = this.blurPreviewSample.getContext('2d');
        ctxPrev.clearRect(0, 0, 60, 20);
        ctxPrev.font = '16px Segoe UI,sans-serif';
        ctxPrev.fillStyle = '#333';
        ctxPrev.fillText('Sample', 5, 16);
        ctxPrev.globalAlpha = 1;
        ctxPrev.filter = `blur(${this.blurSlider.value}px)`;
        ctxPrev.drawImage(ctxPrev.canvas, 0, 0);
        ctxPrev.filter = 'none';
    }

    handleBlurChange(e) {
        this.blurStrength = parseInt(e.target.value);
        this.renderBlurPreview();
        this.reprocessImage();
    }

    loadFaceApiModels() {
        // Lazy-load only if needed
        faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/');
        this.faceApiLoaded = true;
    }

    async reprocessImage() {
        if (!this.originalImage) return;
        this.loadingOverlay.style.display = 'flex';
        this.startTime = performance.now();
        setTimeout(async () => {
            // Reset stats
            this.detectedRects = [];
            this.detectedItems = [];
            this.detectedFaces = [];
            this.undoStack = [];

            // Draw original
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.originalImage, 0, 0);

            // OCR detection
            let textRegions = [];
            try {
                const { data: { words } } = await Tesseract.recognize(this.canvas, 'eng', {
                    logger: m => { if (m.status === 'recognizing text') this.loadingText.textContent = `OCR: ${Math.round(m.progress*100)}%`; }
                });
                textRegions = words.map(w => ({
                    text: w.text,
                    bbox: [w.bbox.x0, w.bbox.y0, w.bbox.x1-w.bbox.x0, w.bbox.y1-w.bbox.y0]
                }));
            } catch (e) {
                this.showToast('OCR failed. Please try again.', 'danger');
            }

            // Sensitive regex
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const phoneRegex = /\b(?:\+?(\d{1,3}))?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}\b/g;
            const ccRegex = /\b(?:\d[ -]*?){13,16}\b/g;
            const addressRegex = /\d+\s+\w+\s+(Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Lane|Ln|Drive|Dr)\b/gi;
            const ssnRegex = /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g;
            const nameToBlur = this.blurNameCheck.checked ? this.userNameInput.value?.trim() : "";
            const customText = this.detectCustom.checked ? this.customTextInput.value?.trim() : "";

            // Detect and blur text
            let textCount = 0;
            for (const region of textRegions) {
                let types = [];
                if (this.detectEmails.checked && emailRegex.test(region.text)) types.push('Email');
                if (this.detectPhones.checked && phoneRegex.test(region.text)) types.push('Phone');
                if (this.detectCreditCards.checked && ccRegex.test(region.text)) types.push('Credit Card');
                if (this.detectAddresses.checked && addressRegex.test(region.text)) types.push('Address');
                if (this.detectSSN.checked && ssnRegex.test(region.text)) types.push('SSN');
                if (nameToBlur && region.text.toLowerCase().includes(nameToBlur.toLowerCase())) types.push('Name');
                if (customText && region.text.toLowerCase().includes(customText.toLowerCase())) types.push('Custom');
                if (types.length > 0) {
                    // Expand the region a bit for safety
                    const [x,y,w,h] = region.bbox;
                    this.applyBlur(x-5, y-5, w+10, h+10, types[0]);
                    textCount++;
                    this.detectedItems.push({ type: types[0], text: region.text, bbox: region.bbox });
                }
            }

            // Face detection
            let faceCount = 0;
            if (this.detectFaces.checked && this.faceApiLoaded) {
                const detections = await faceapi.detectAllFaces(this.canvas, new faceapi.TinyFaceDetectorOptions());
                for (const det of detections) {
                    const { x, y, width, height } = det.box;
                    this.applyBlur(x-10, y-10, width+20, height+20, 'Face');
                    this.detectedItems.push({ type: 'Face', bbox: [x, y, width, height] });
                    faceCount++;
                }
            }

            // Update stats
            this.textDetections.textContent = textCount;
            this.faceDetections.textContent = faceCount;
            this.totalDetections.textContent = textCount + faceCount;
            this.processingTime.textContent = ((performance.now()-this.startTime)/1000).toFixed(1);

            // Detected list
            this.detectedItemsContent.innerHTML = this.detectedItems.map(item =>
                `<span class="detected-item" title="${item.text || ''}">${item.type}</span>`
            ).join('');
            this.detectedItemsList.style.display = this.detectedItems.length ? '' : 'none';
            this.detectionStats.style.display = '';
            // Show download/reset
            this.downloadBtn.style.display = '';
            this.downloadOriginalBtn.style.display = '';
            this.undoBtn.style.display = '';
            this.resetBtn.style.display = '';
            // Before/after
            if (this.beforeAfterMode.checked) {
                this.showBeforeAfter();
            } else {
                this.beforeAfterContainer.style.display = 'none';
            }
            this.loadingOverlay.style.display = 'none';
        }, 250);
    }

    applyBlur(x, y, w, h, type) {
        x = Math.max(0, x); y = Math.max(0, y);
        w = Math.min(this.canvas.width-x, w); h = Math.min(this.canvas.height-y, h);
        const blurMethod = this.blurStyle.value;
        if (blurMethod === 'gaussian') {
            this.ctx.save();
            this.ctx.filter = `blur(${this.blurStrength}px)`;
            this.ctx.drawImage(this.canvas, x, y, w, h, x, y, w, h);
            this.ctx.restore();
        } else if (blurMethod === 'pixelate') {
            // Pixelate
            const size = Math.max(4, Math.floor(this.blurStrength/2));
            const imgData = this.ctx.getImageData(x, y, w, h);
            for (let py = 0; py < h; py += size) {
                for (let px = 0; px < w; px += size) {
                    const i = ((py*w + px)*4);
                    const r = imgData.data[i], g = imgData.data[i+1], b = imgData.data[i+2], a = imgData.data[i+3];
                    for (let dy = 0; dy < size; dy++) {
                        for (let dx = 0; dx < size; dx++) {
                            if (px+dx < w && py+dy < h) {
                                const ni = (((py+dy)*w + (px+dx))*4);
                                imgData.data[ni] = r; imgData.data[ni+1] = g;
                                imgData.data[ni+2] = b; imgData.data[ni+3] = a;
                            }
                        }
                    }
                }
            }
            this.ctx.putImageData(imgData, x, y);
        } else {
            // Blackout
            this.ctx.save();
            this.ctx.fillStyle = "#151515";
            this.ctx.globalAlpha = 0.87;
            this.ctx.fillRect(x, y, w, h);
            this.ctx.restore();
        }
        this.undoStack.push(this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height));
    }

    showBeforeAfter() {
        this.beforeAfterContainer.style.display = '';
        // Before
        this.beforeCanvas.width = this.canvas.width;
        this.beforeCanvas.height = this.canvas.height;
        this.beforeCtx.clearRect(0,0,this.beforeCanvas.width,this.beforeCanvas.height);
        this.beforeCtx.drawImage(this.originalImage, 0, 0);
        // After
        this.afterCanvas.width = this.canvas.width;
        this.afterCanvas.height = this.canvas.height;
        this.afterCtx.clearRect(0,0,this.afterCanvas.width,this.afterCanvas.height);
        this.afterCtx.drawImage(this.canvas,0,0);
    }

    toggleBeforeAfterMode(checked) {
        if (checked) this.showBeforeAfter();
        else this.beforeAfterContainer.style.display = 'none';
    }

    downloadImage() {
        const link = document.createElement('a');
        link.download = 'blurshield-protected.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    downloadOriginalImage() {
        const link = document.createElement('a');
        link.download = 'blurshield-original.png';
        // If originalImage was loaded from a file, you probably need to save the canvas as-is
        this.beforeCanvas.toBlob(blob => {
            link.href = URL.createObjectURL(blob);
            link.click();
        });
    }

    undoLastAction() {
        if (this.undoStack.length > 1) {
            this.undoStack.pop();
            const prev = this.undoStack[this.undoStack.length-1];
            this.ctx.putImageData(prev, 0, 0);
        } else {
            this.showToast('No more undos left!', 'warning');
        }
    }

    resetAll() {
        if (!this.originalImage) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.originalImage, 0, 0);
        this.undoStack = [];
        this.detectedItems = [];
        this.detectionStats.style.display = 'none';
        this.detectedItemsList.style.display = 'none';
        this.downloadBtn.style.display = 'none';
        this.downloadOriginalBtn.style.display = 'none';
        this.undoBtn.style.display = 'none';
        this.resetBtn.style.display = 'none';
    }

    showToast(message, type='success') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
        toast.role = "alert";
        toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
        document.querySelector('.toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 2600);
    }
}

// Init the app
window.onload = () => new BlurShieldApp();
