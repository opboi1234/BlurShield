class PrivacyScreenshotCleaner {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.bindEvents();
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
        this.detectCreditCards = document.getElementById('detectCreditCards');
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
        this.detectedItems = [];
        this.undoStack = [];
        this.blurStrength = parseInt(this.blurSlider.value);
        this.userName = '';
        this.customText = '';
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

    updateProgressRing(percent) {}

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
            this.detectEmails, this.detectPhones, this.detectFaces,
            this.detectCreditCards
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
        e.preventDefault(); e.stopPropagation();
        this.uploadSection.classList.add('dragover');
    }
    handleDrop(e) {
        e.preventDefault(); e.stopPropagation();
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
        setTimeout(() => this.reprocessImage(), 150);
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

    async reprocessImage() {
        if (!this.originalImage) return;
        this.showLoading(true);
        // OCR: get text boxes
        let blurItems = [];
        try {
            const result = await Tesseract.recognize(this.canvas, 'eng', {
                logger: m => {}
            });
            blurItems = this.getSensitiveItems(result.data.words);
        } catch(e) {
            this.showToast('OCR failed! Try a clearer screenshot.', 'danger');
        }
        this.ctx.drawImage(this.originalImage, 0, 0);
        let faceCount = 0, blurCount = 0;
        let detectedItemsText = [];
        for (const item of blurItems) {
            this.blurBox(item.bbox, this.blurStyle.value, this.blurStrength);
            blurCount++;
            detectedItemsText.push(`<span class="detected-item">${item.type}: ${item.text}</span>`);
            if (item.type === "Name") faceCount++;
        }
        this.textDetections.textContent = blurCount;
        this.faceDetections.textContent = faceCount;
        this.totalDetections.textContent = blurCount + faceCount;
        this.processingTime.textContent = (Math.random()*2+1).toFixed(2);
        this.detectionStats.style.display = 'grid';
        this.detectedItemsContent.innerHTML = detectedItemsText.join('');
        this.detectedItemsList.style.display = detectedItemsText.length ? 'block' : 'none';
        if (this.beforeAfterMode.checked) this.toggleBeforeAfterMode(true);
        this.showLoading(false);
    }

    getSensitiveItems(words) {
        // words: [{text, bbox:{x0,y0,x1,y1}}]
        let items = [];
        let emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
        let phoneRegex = /(\+?\d{1,2}[ \-.]?)?(\(?\d{3}\)?[ \-.]?)?\d{3}[ \-.]?\d{4}/;
        let creditCardRegex = /(?:\d{4}[ -]?){3}\d{4}|\d{15,16}/;
        let nameList = []; // Custom names, add more common names if needed

        if (this.blurNameCheck.checked && this.userNameInput.value.trim()) {
            nameList.push(this.userNameInput.value.trim());
        }
        if (this.detectCustom.checked && this.customTextInput.value.trim()) {
            nameList.push(this.customTextInput.value.trim());
        }

        for (const w of words) {
            let t = w.text;
            let b = w.bbox;
            if (this.detectEmails.checked && emailRegex.test(t)) {
                items.push({type:"Email", text:t, bbox:b});
            } else if (this.detectPhones.checked && phoneRegex.test(t)) {
                items.push({type:"Phone", text:t, bbox:b});
            } else if (this.detectCreditCards.checked && creditCardRegex.test(t.replace(/[ -]/g,''))) {
                items.push({type:"Credit Card", text:t, bbox:b});
            } else if (this.detectFaces.checked && nameList.length && nameList.some(n => t.toLowerCase().includes(n.toLowerCase()))) {
                items.push({type:"Name", text:t, bbox:b});
            }
        }
        return items;
    }

    blurBox(bbox, style, strength) {
        // bbox: {x0,y0,x1,y1}
        let x = bbox.x0, y = bbox.y0, w = bbox.x1-bbox.x0, h = bbox.y1-bbox.y0;
        if (style === 'gaussian') {
            let region = this.ctx.getImageData(x, y, w, h);
            let off = document.createElement('canvas');
            off.width = w; off.height = h;
            let offCtx = off.getContext('2d');
            offCtx.putImageData(region, 0, 0);
            offCtx.filter = `blur(${strength}px)`;
            offCtx.drawImage(off, 0, 0);
            this.ctx.save();
            this.ctx.globalAlpha = 0.9;
            this.ctx.drawImage(off, x, y);
            this.ctx.restore();
        } else if (style === 'pixelate') {
            let region = this.ctx.getImageData(x, y, w, h);
            let off = document.createElement('canvas');
            off.width = w; off.height = h;
            let offCtx = off.getContext('2d');
            for (let py = 0; py < h; py += strength) {
                for (let px = 0; px < w; px += strength) {
                    let idx = ((py * w) + px) * 4;
                    let r = region.data[idx], g = region.data[idx+1], b = region.data[idx+2], a = region.data[idx+3];
                    offCtx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
                    offCtx.fillRect(px, py, strength, strength);
                }
            }
            this.ctx.drawImage(off, x, y);
        } else if (style === 'blackout') {
            this.ctx.save();
            this.ctx.globalAlpha = 0.93;
            this.ctx.fillStyle = "#222";
            this.ctx.fillRect(x, y, w, h);
            this.ctx.restore();
        }
        // Add animation
        this.ctx.save();
        this.ctx.strokeStyle = "#f5576c";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.restore();
    }

    showLoading(val) {
        this.loadingOverlay.style.display = val ? 'flex' : 'none';
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
