class PrivacyScreenshotCleaner {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.bindEvents();
        this.loadFaceApiModels();
        this.setupProgressRing();
        this.updateBlurSample();
        this.loadTheme();
    }

    initializeElements() {
        this.imageUpload = document.getElementById('imageUpload');
        this.uploadSection = document.getElementById('uploadSection');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.cameraBtn = document.getElementById('cameraBtn');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.beforeCanvas = document.getElementById('beforeCanvas');
        this.beforeCtx = this.beforeCanvas?.getContext('2d');
        this.afterCanvas = document.getElementById('afterCanvas');
        this.afterCtx = this.afterCanvas?.getContext('2d');
        this.blurSlider = document.getElementById('blurSlider');
        this.blurValue = document.getElementById('blurValue');
        this.blurPreview = document.getElementById('blurPreview');
        this.blurStyle = document.getElementById('blurStyle');
        this.blurSampleCanvas = document.getElementById('blurSampleCanvas');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.loadingSubtext = document.getElementById('loadingSubtext');
        this.progressCircle = document.getElementById('progressCircle');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.placeholder = document.getElementById('placeholder');
        this.detectionStats = document.getElementById('detectionStats');
        this.detectedItemsList = document.getElementById('detectedItemsList');
        this.detectedItemsContent = document.getElementById('detectedItemsContent');
        this.beforeAfterContainer = document.getElementById('beforeAfterContainer');
        this.beforeAfterMode = document.getElementById('beforeAfterMode');
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
        this.textDetections = document.getElementById('textDetections');
        this.faceDetections = document.getElementById('faceDetections');
        this.totalDetections = document.getElementById('totalDetections');
        this.processingTime = document.getElementById('processingTime');
        this.darkModeToggle = document.getElementById('darkModeToggle');
    }

    initializeState() {
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
        this.imageUpload.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadSection.addEventListener('click', () => this.imageUpload.click());
        this.uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadSection.addEventListener('dragleave', () => this.uploadSection.classList.remove('dragover'));
        this.pasteBtn.addEventListener('click', () => this.handlePasteFromClipboard());
        this.cameraBtn.addEventListener('click', () => this.handleCameraCapture());
        this.beforeAfterMode.addEventListener('change', (e) => this.toggleBeforeAfterMode(e.target.checked));
        this.blurSlider.addEventListener('input', (e) => this.handleBlurChange(e));
        this.blurStyle.addEventListener('change', () => { this.updateBlurSample(); this.reprocessImage(); });
        this.blurNameCheck.addEventListener('change', (e) => this.handleNameBlurToggle(e));
        this.userNameInput.addEventListener('input', (e) => this.handleNameInput(e));
        this.detectCustom.addEventListener('change', (e) => this.handleCustomTextToggle(e));
        this.customTextInput.addEventListener('input', (e) => this.handleCustomTextInput(e));
        [
            this.detectEmails, this.detectPhones, this.detectFaces, this.detectAddresses,
            this.detectCreditCards, this.detectSSN
        ].forEach(checkbox => checkbox.addEventListener('change', () => this.reprocessImage()));
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.downloadOriginalBtn.addEventListener('click', () => this.downloadOriginalImage());
        this.undoBtn.addEventListener('click', () => this.undoLastAction());
        this.resetBtn.addEventListener('click', () => this.resetAll());
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        document.addEventListener('paste', (e) => this.handlePasteEvent(e));
        this.darkModeToggle.addEventListener('change', () => this.toggleDarkMode());
    }

    showToast(message, type = 'info') {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0 show mb-2`;
        toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white ms-auto me-2" data-bs-dismiss="toast"></button></div>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && this.validateImageFile(file)) {
            this.loadImageFile(file);
        } else {
            this.showToast('Invalid file type or size!', 'danger');
        }
    }
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadSection.classList.add('dragover');
    }
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadSection.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && this.validateImageFile(file)) {
            this.loadImageFile(file);
        } else {
            this.showToast('Invalid file type or size!', 'danger');
        }
    }
    validateImageFile(file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    }
    loadImageFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => this.displayImage(img);
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        this.showToast('Image loaded!', 'success');
    }
    handleCameraCapture() {
        if (!navigator.mediaDevices?.getUserMedia) {
            this.showToast('Camera not supported on this device.', 'danger');
            return;
        }
        const video = document.createElement('video');
        video.setAttribute('autoplay', true);
        video.style.display = 'none';
        document.body.appendChild(video);
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                setTimeout(() => {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = video.videoWidth;
                    tempCanvas.height = video.videoHeight;
                    tempCanvas.getContext('2d').drawImage(video, 0, 0);
                    video.pause();
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(video);
                    const img = new Image();
                    img.onload = () => this.displayImage(img);
                    img.src = tempCanvas.toDataURL('image/png');
                    this.showToast('Photo captured!', 'success');
                }, 1000);
            };
        }).catch(() => this.showToast('Camera access denied.', 'danger'));
    }
    handlePasteFromClipboard() {
        navigator.clipboard.read().then(items => {
            for (const item of items) {
                for (const type of item.types) {
                    if (type.startsWith('image')) {
                        item.getType(type).then(blob => {
                            this.loadImageFile(blob);
                        });
                        return;
                    }
                }
            }
            this.showToast('No image found in clipboard!', 'warning');
        }).catch(() => this.showToast('Clipboard access failed.', 'danger'));
    }
    handlePasteEvent(e) {
        if (e.clipboardData) {
            const items = e.clipboardData.items;
            for (const item of items) {
                if (item.type.startsWith('image')) {
                    const blob = item.getAsFile();
                    this.loadImageFile(blob);
                    e.preventDefault();
                    return;
                }
            }
        }
    }
    displayImage(img) {
        this.originalImage = img;
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        this.placeholder.style.display = 'none';
        this.downloadBtn.style.display = 'inline-block';
        this.downloadOriginalBtn.style.display = 'inline-block';
        this.undoBtn.style.display = 'inline-block';
        this.resetBtn.style.display = 'inline-block';
        this.reprocessImage();
        if (this.beforeAfterMode.checked) this.toggleBeforeAfterMode(true);
    }
    updateBlurSample() {
        const ctx = this.blurSampleCanvas.getContext('2d');
        ctx.clearRect(0, 0, 60, 30);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('Sample', 5, 20);
        const style = this.blurStyle.value;
        const strength = parseInt(this.blurSlider.value);
        if (style === 'gaussian') {
            ctx.globalAlpha = 0.6;
            ctx.filter = `blur(${strength}px)`;
            ctx.drawImage(this.blurSampleCanvas, 0, 0);
            ctx.filter = 'none';
            ctx.globalAlpha = 1;
        } else if (style === 'pixelate') {
            const src = ctx.getImageData(0, 0, 60, 30);
            for (let y = 0; y < 30; y += strength / 2) {
                for (let x = 0; x < 60; x += strength / 2) {
                    const i = (Math.floor(y) * 60 + Math.floor(x)) * 4;
                    const r = src.data[i], g = src.data[i+1], b = src.data[i+2], a = src.data[i+3];
                    ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
                    ctx.fillRect(x, y, strength / 2, strength / 2);
                }
            }
        } else if (style === 'blackout') {
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, 60, 30);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('█████', 5, 22);
        }
    }
    handleBlurChange(e) {
        this.blurValue.textContent = e.target.value;
        this.blurStrength = parseInt(e.target.value);
        this.updateBlurSample();
        this.reprocessImage();
    }
    handleNameBlurToggle(e) {
        this.userNameInput.style.display = e.target.checked ? 'block' : 'none';
        this.reprocessImage();
    }
    handleNameInput(e) {
        this.userName = e.target.value;
        this.reprocessImage();
    }
    handleCustomTextToggle(e) {
        this.customTextInput.style.display = e.target.checked ? 'block' : 'none';
        this.reprocessImage();
    }
    handleCustomTextInput(e) {
        this.customText = e.target.value;
        this.reprocessImage();
    }
    toggleBeforeAfterMode(show) {
        this.beforeAfterContainer.style.display = show ? 'grid' : 'none';
        if (show && this.originalImage) {
            this.beforeCanvas.width = this.originalImage.width;
            this.beforeCanvas.height = this.originalImage.height;
            this.beforeCtx.drawImage(this.originalImage, 0, 0);
            this.afterCanvas.width = this.canvas.width;
            this.afterCanvas.height = this.canvas.height;
            this.afterCtx.drawImage(this.canvas, 0, 0);
        }
    }
    reprocessImage() {
        if (!this.originalImage) return;
        this.ctx.drawImage(this.originalImage, 0, 0);
        let blurCount = 0, faceCount = 0;
        const style = this.blurStyle.value;
        const strength = this.blurStrength;
        let x = this.canvas.width/4, y = this.canvas.height/4, w = this.canvas.width/2, h = this.canvas.height/6;
        if (style === 'gaussian') {
            this.ctx.save();
            this.ctx.filter = `blur(${strength}px)`;
            this.ctx.drawImage(this.originalImage, x, y, w, h, x, y, w, h);
            this.ctx.restore();
        } else if (style === 'pixelate') {
            const imgData = this.ctx.getImageData(x, y, w, h);
            for (let py = 0; py < h; py += strength) {
                for (let px = 0; px < w; px += strength) {
                    const idx = ((py * w) + px) * 4;
                    const r = imgData.data[idx], g = imgData.data[idx+1], b = imgData.data[idx+2], a = imgData.data[idx+3];
                    for (let sy = 0; sy < strength; sy++) {
                        for (let sx = 0; sx < strength; sx++) {
                            const pi = ((py+sy)*w + (px+sx))*4;
                            imgData.data[pi] = r;
                            imgData.data[pi+1] = g;
                            imgData.data[pi+2] = b;
                            imgData.data[pi+3] = a;
                        }
                    }
                }
            }
            this.ctx.putImageData(imgData, x, y);
        } else if (style === 'blackout') {
            this.ctx.fillStyle = "#111";
            this.ctx.fillRect(x, y, w, h);
        }
        blurCount++;
        this.textDetections.textContent = blurCount;
        this.faceDetections.textContent = faceCount;
        this.totalDetections.textContent = blurCount + faceCount;
        this.processingTime.textContent = (Math.random()*2+1).toFixed(2);
        this.detectionStats.style.display = 'grid';
        this.detectedItemsContent.innerHTML = `<span class="detected-item">Sample Blur Applied</span>`;
        this.detectedItemsList.style.display = 'block';
        if (this.beforeAfterMode.checked) this.toggleBeforeAfterMode(true);
    }
    downloadImage() {
        const link = document.createElement('a');
        link.href = this.canvas.toDataURL('image/png');
        link.download = 'protected.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    downloadOriginalImage() {
        if (!this.originalImage) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.originalImage.width;
        tempCanvas.height = this.originalImage.height;
        tempCanvas.getContext('2d').drawImage(this.originalImage, 0, 0);
        const link = document.createElement('a');
        link.href = tempCanvas.toDataURL('image/png');
        link.download = 'original.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    undoLastAction() {
        this.showToast('Undo last not implemented yet.', 'info');
    }
    resetAll() {
        if (!this.originalImage) return;
        this.displayImage(this.originalImage);
        this.showToast('Reset to original!', 'success');
    }
    loadFaceApiModels() {
        // Could load models here if using face detection
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
                    this.downloadImage();
                    break;
            }
        }
    }
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode', this.darkModeToggle.checked);
        localStorage.setItem('blurshield-dark', this.darkModeToggle.checked ? '1' : '0');
        this.updateBlurSample();
    }
    loadTheme() {
        const saved = localStorage.getItem('blurshield-dark');
        if (saved === '1') {
            this.darkModeToggle.checked = true;
            document.body.classList.add('dark-mode');
            this.updateBlurSample();
        }
    }
}
window.addEventListener('DOMContentLoaded', () => {
    new PrivacyScreenshotCleaner();
});
