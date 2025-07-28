class AIPrivacyShield {
    constructor() {
        this.originalCanvas = null;
        this.processedCanvas = null;
        this.originalImage = null;
        this.detectedItems = [];
        this.stats = {
            processed: 0,
            detected: 0,
            protected: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
        this.initializeAnimations();
    }

    setupEventListeners() {
        // File upload
        const uploadSection = document.getElementById('uploadSection');
        const imageUpload = document.getElementById('imageUpload');
        
        uploadSection.addEventListener('click', () => imageUpload.click());
        uploadSection.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadSection.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadSection.addEventListener('drop', this.handleDrop.bind(this));
        
        imageUpload.addEventListener('change', this.handleFileSelect.bind(this));

        // Paste from clipboard
        document.getElementById('pasteBtn').addEventListener('click', this.pasteFromClipboard.bind(this));
        
        // Camera capture
        document.getElementById('cameraBtn').addEventListener('click', this.captureFromCamera.bind(this));

        // Control changes
        this.setupControlListeners();

        // Action buttons
        document.getElementById('processBtn').addEventListener('click', this.processImage.bind(this));
        document.getElementById('downloadBtn').addEventListener('click', this.downloadImage.bind(this));
        document.getElementById('resetBtn').addEventListener('click', this.resetAll.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Real-time blur preview
        document.getElementById('blurStrength').addEventListener('input', this.updateBlurPreview.bind(this));
    }

    setupControlListeners() {
        const controls = [
            'detectEmails', 'detectPhones', 'detectFaces', 'detectAddresses',
            'detectCreditCards', 'detectSSN', 'detectNames', 'detectDates',
            'detectNumbers', 'detectUrls'
        ];

        controls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', this.onControlChange.bind(this));
            }
        });

        // Blur settings
        document.getElementById('blurStrength').addEventListener('input', this.onControlChange.bind(this));
        document.getElementById('customKeywords').addEventListener('input', this.onControlChange.bind(this));
        document.getElementById('blurType').addEventListener('change', this.onControlChange.bind(this));
        document.getElementById('smartDetection').addEventListener('change', this.onControlChange.bind(this));
    }

    initializeAnimations() {
        // Animate stats on load
        this.animateStats();
        
        // Add intersection observer for scroll animations
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.glass-card').forEach(card => {
            observer.observe(card);
        });
    }

    animateStats() {
        const stats = ['processedCount', 'detectedCount', 'protectedCount'];
        stats.forEach((statId, index) => {
            setTimeout(() => {
                this.animateNumber(statId, this.stats[statId.replace('Count', '')]);
            }, index * 200);
        });
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const duration = 1000;
        const steps = 60;
        const increment = targetValue / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            current += increment;
            step++;
            
            element.textContent = Math.floor(current);
            
            if (step >= steps) {
                element.textContent = targetValue;
                clearInterval(timer);
            }
        }, duration / steps);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadSection').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadSection').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadSection').classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.loadImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        }
    }

    async pasteFromClipboard() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        this.loadImage(blob);
                        return;
                    }
                }
            }
            this.showNotification('No image found in clipboard', 'warning');
        } catch (error) {
            this.showNotification('Failed to access clipboard', 'error');
        }
    }

    async captureFromCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            const modal = this.createCameraModal(video, stream);
            document.body.appendChild(modal);
        } catch (error) {
            this.showNotification('Camera access denied', 'error');
        }
    }

    createCameraModal(video, stream) {
        const modal = document.createElement('div');
        modal.className = 'loading-overlay';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="loading-content" style="max-width: 800px;">
                <button class="close-modal" onclick="this.closest('.loading-overlay').remove(); arguments[0].stream.getTracks().forEach(track => track.stop());">×</button>
                <h2 style="color: white; margin-bottom: 2rem;">Capture Screenshot</h2>
                <div style="margin-bottom: 2rem;">
                    <video id="cameraVideo" autoplay style="width: 100%; border-radius: 12px;"></video>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn btn-primary" onclick="window.privacyShield.capturePhoto(this)">
                        <i class="bi bi-camera"></i> Capture
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.loading-overlay').remove(); arguments[0].stream.getTracks().forEach(track => track.stop());">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        const videoElement = modal.querySelector('#cameraVideo');
        videoElement.srcObject = stream;
        modal.stream = stream;

        return modal;
    }

    capturePhoto(button) {
        const modal = button.closest('.loading-overlay');
        const video = modal.querySelector('#cameraVideo');
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(blob => {
            this.loadImage(blob);
            modal.stream.getTracks().forEach(track => track.stop());
            modal.remove();
        });
    }

    loadImage(file) {
        this.showLoading('Loading image...', 'Preparing for AI analysis');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.createCanvases();
                this.showControls();
                this.hideLoading();
                this.updateStats('processed', 1);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    createCanvases() {
        // Create original canvas
        this.originalCanvas = document.createElement('canvas');
        this.originalCanvas.width = this.originalImage.width;
        this.originalCanvas.height = this.originalImage.height;
        
        const ctx = this.originalCanvas.getContext('2d');
        ctx.drawImage(this.originalImage, 0, 0);

        // Create processed canvas
        this.processedCanvas = document.createElement('canvas');
        this.processedCanvas.width = this.originalImage.width;
        this.processedCanvas.height = this.originalImage.height;

        // Display canvases
        this.displayCanvases();
    }

    displayCanvases() {
        const beforeAfterContainer = document.getElementById('beforeAfterContainer');
        const originalCanvasContainer = document.getElementById('originalCanvas');
        const processedCanvasContainer = document.getElementById('processedCanvas');

        // Clear existing canvases
        originalCanvasContainer.innerHTML = '';
        processedCanvasContainer.innerHTML = '';

        // Add canvases
        originalCanvasContainer.appendChild(this.originalCanvas.cloneNode());
        processedCanvasContainer.appendChild(this.originalCanvas.cloneNode());

        beforeAfterContainer.style.display = 'block';
    }

    showControls() {
        document.getElementById('controlsPanel').style.display = 'block';
        document.getElementById('actionButtons').style.display = 'flex';
        
        // Trigger animations
        setTimeout(() => {
            document.getElementById('controlsPanel').style.animation = 'fadeInScale 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        }, 100);
    }

    onControlChange() {
        this.updateBlurPreview();
        if (this.processedCanvas) {
            // Real-time preview if image is already processed
            this.processImage();
        }
    }

    updateBlurPreview() {
        const blurStrength = document.getElementById('blurStrength').value;
        const preview = document.getElementById('blurPreview');
        
        if (preview) {
            const blurValue = Math.max(1, blurStrength / 2);
            preview.style.filter = `blur(${blurValue}px)`;
            preview.textContent = `Blur Preview (${blurStrength}px)`;
            
            // Update slider value display
            document.getElementById('blurValue').textContent = `${blurStrength}px`;
        }
    }

    async processImage() {
        if (!this.originalCanvas) return;

        this.showLoading('AI Processing...', 'Detecting sensitive information with advanced algorithms');
        
        try {
            // Simulate processing time for better UX
            await this.sleep(1000);
            
            // Detect sensitive information
            await this.detectSensitiveInfo();
            
            // Apply smart blurring
            await this.applySmartBlurring();
            
            // Update UI
            this.displayResults();
            this.updateStats('protected', this.detectedItems.length);
            
            this.hideLoading();
            this.showNotification('Image processed successfully!', 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showNotification('Processing failed. Please try again.', 'error');
            console.error('Processing error:', error);
        }
    }

    async detectSensitiveInfo() {
        this.detectedItems = [];
        
        // Get image data for OCR simulation
        const ctx = this.originalCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, this.originalCanvas.width, this.originalCanvas.height);
        
        // Simulate OCR text extraction
        const extractedText = await this.simulateOCR(imageData);
        
        // Detect different types of sensitive information
        await this.detectEmails(extractedText);
        await this.detectPhones(extractedText);
        await this.detectCreditCards(extractedText);
        await this.detectSSN(extractedText);
        await this.detectAddresses(extractedText);
        await this.detectNames(extractedText);
        await this.detectDates(extractedText);
        await this.detectNumbers(extractedText);
        await this.detectUrls(extractedText);
        await this.detectCustomKeywords(extractedText);
        
        // Simulate face detection
        if (document.getElementById('detectFaces').checked) {
            await this.detectFaces();
        }
        
        this.updateStats('detected', this.detectedItems.length);
    }

    async simulateOCR(imageData) {
        // Simulate OCR processing
        await this.sleep(500);
        
        // Return simulated extracted text for demo purposes
        return `
            John Doe
            john.doe@email.com
            (555) 123-4567
            123 Main Street, Anytown, ST 12345
            Credit Card: 4532-1234-5678-9012
            SSN: 123-45-6789
            Date: 12/25/2023
            Account: 987654321
            https://example.com/private
            Confidential Document
            Password: secret123
        `;
    }

    async detectEmails(text) {
        if (!document.getElementById('detectEmails').checked) return;
        
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const matches = text.match(emailRegex) || [];
        
        matches.forEach(email => {
            this.detectedItems.push({
                type: 'Email',
                text: email,
                coordinates: this.getRandomCoordinates(),
                confidence: 0.95
            });
        });
    }

    async detectPhones(text) {
        if (!document.getElementById('detectPhones').checked) return;
        
        const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4})/g;
        const matches = text.match(phoneRegex) || [];
        
        matches.forEach(phone => {
            this.detectedItems.push({
                type: 'Phone',
                text: phone,
                coordinates: this.getRandomCoordinates(),
                confidence: 0.92
            });
        });
    }

    async detectCreditCards(text) {
        if (!document.getElementById('detectCreditCards').checked) return;
        
        const ccRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
        const matches = text.match(ccRegex) || [];
        
        matches.forEach(cc => {
            this.detectedItems.push({
                type: 'Credit Card',
                text: cc,
                coordinates: this.getRandomCoordinates(),
                confidence: 0.98
            });
        });
    }

    async detectSSN(text) {
        if (!document.getElementById('detectSSN').checked) return;
        
        const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
        const matches = text.match(ssnRegex) || [];
        
        matches.forEach(ssn => {
            this.detectedItems.push({
                type: 'SSN',
                text: ssn,
                coordinates: this.getRandomCoordinates(),
                confidence: 0.97
            });
        });
    }

    async detectAddresses(text) {
        if (!document.getElementById('detectAddresses').checked) return;
        
        const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)/gi;
        const matches = text.match(addressRegex) || [];
        
        matches.forEach(address => {
            this.detectedItems.push({
                type: 'Address',
                text: address,
                coordinates: this.getRandomCoordinates(),
                confidence: 0.89
            });
        });
    }

    async detectNames(text) {
        if (!document.getElementById('detectNames').checked) return;
        
        const commonNames = ['John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Wilson'];
        commonNames.forEach(name => {
            if (text.includes(name)) {
                this.detectedItems.push({
                    type: 'Name',
                    text: name,
                    coordinates: this.getRandomCoordinates(),
                    confidence: 0.85
                });
            }
        });
    }

    async detectDates(text) {
        if (!document.getElementById('detectDates').checked) return;
        
        const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g;
        const matches = text.match(dateRegex) || [];
        
        matches.forEach(date => {
            this.detectedItems.push({
                type: 'Date',
                text: date,
                coordinates: this.getRandomCoordinates(),
                confidence: 0.88
            });
        });
    }

    async detectNumbers(text) {
        if (!document.getElementById('detectNumbers').checked) return;
        
        const numberRegex = /\b\d{6,}\b/g;
        const matches = text.match(numberRegex) || [];
        
        matches.forEach(number => {
            this.detectedItems.push({
                type: 'Number',
                text: number,
                coordinates: this.getRandomCoordinates(),
                confidence: 0.82
            });
        });
    }

    async detectUrls(text) {
        if (!document.getElementById('detectUrls').checked) return;
        
        const urlRegex = /https?:\/\/[^\s]+/g;
        const matches = text.match(urlRegex) || [];
        
        matches.forEach(url => {
            this.detectedItems.push({
                type: 'URL',
                text: url,
                coordinates: this.getRandomCoordinates(),
                confidence: 0.94
            });
        });
    }

    async detectCustomKeywords(text) {
        const keywords = document.getElementById('customKeywords').value;
        if (!keywords.trim()) return;
        
        const keywordList = keywords.split(',').map(k => k.trim());
        keywordList.forEach(keyword => {
            if (keyword && text.toLowerCase().includes(keyword.toLowerCase())) {
                this.detectedItems.push({
                    type: 'Custom',
                    text: keyword,
                    coordinates: this.getRandomCoordinates(),
                    confidence: 0.90
                });
            }
        });
    }

    async detectFaces() {
        // Simulate face detection
        await this.sleep(300);
        
        // Add simulated face detection results
        const faceCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < faceCount; i++) {
            this.detectedItems.push({
                type: 'Face',
                text: `Face ${i + 1}`,
                coordinates: this.getRandomCoordinates(true),
                confidence: 0.93
            });
        }
    }

    getRandomCoordinates(isLarge = false) {
        const width = this.originalCanvas.width;
        const height = this.originalCanvas.height;
        const size = isLarge ? 100 : 50;
        
        return {
            x: Math.random() * (width - size),
            y: Math.random() * (height - size),
            width: size + Math.random() * (isLarge ? 100 : 50),
            height: size + Math.random() * (isLarge ? 100 : 50)
        };
    }

    async applySmartBlurring() {
        const ctx = this.processedCanvas.getContext('2d');
        ctx.drawImage(this.originalCanvas, 0, 0);
        
        const blurStrength = parseInt(document.getElementById('blurStrength').value);
        const blurType = document.getElementById('blurType').value;
        const smartDetection = document.getElementById('smartDetection').checked;
        
        // Apply different blur techniques based on settings
        for (const item of this.detectedItems) {
            await this.applyBlurToRegion(ctx, item, blurStrength, blurType, smartDetection);
        }
    }

    async applyBlurToRegion(ctx, item, blurStrength, blurType, smartDetection) {
        const { x, y, width, height } = item.coordinates;
        
        // Extract the region
        const imageData = ctx.getImageData(x, y, width, height);
        const data = imageData.data;
        
        // Apply different blur algorithms
        switch (blurType) {
            case 'gaussian':
                this.applyGaussianBlur(data, width, height, blurStrength);
                break;
            case 'pixelate':
                this.applyPixelation(data, width, height, Math.max(5, blurStrength / 2));
                break;
            case 'blackout':
                this.applyBlackout(data, width, height);
                break;
            default:
                this.applyAdvancedBlur(data, width, height, blurStrength, smartDetection);
        }
        
        // Put the blurred region back
        ctx.putImageData(imageData, x, y);
        
        // Add visual indicator
        this.addBlurIndicator(ctx, item, blurType);
    }

    applyGaussianBlur(data, width, height, strength) {
        const radius = Math.min(strength, 50);
        const sigma = radius / 3;
        
        // Create Gaussian kernel
        const kernel = this.createGaussianKernel(radius, sigma);
        
        // Apply horizontal pass
        const temp = new Uint8ClampedArray(data);
        this.applyConvolution(data, temp, width, height, kernel, true);
        
        // Apply vertical pass
        this.applyConvolution(temp, data, width, height, kernel, false);
    }

    createGaussianKernel(radius, sigma) {
        const kernel = [];
        let sum = 0;
        
        for (let i = -radius; i <= radius; i++) {
            const value = Math.exp(-(i * i) / (2 * sigma * sigma));
            kernel.push(value);
            sum += value;
        }
        
        // Normalize
        return kernel.map(v => v / sum);
    }

    applyConvolution(source, target, width, height, kernel, horizontal) {
        const radius = Math.floor(kernel.length / 2);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                
                for (let i = -radius; i <= radius; i++) {
                    let sampleX = horizontal ? Math.max(0, Math.min(width - 1, x + i)) : x;
                    let sampleY = horizontal ? y : Math.max(0, Math.min(height - 1, y + i));
                    
                    const idx = (sampleY * width + sampleX) * 4;
                    const weight = kernel[i + radius];
                    
                    r += source[idx] * weight;
                    g += source[idx + 1] * weight;
                    b += source[idx + 2] * weight;
                    a += source[idx + 3] * weight;
                }
                
                const targetIdx = (y * width + x) * 4;
                target[targetIdx] = r;
                target[targetIdx + 1] = g;
                target[targetIdx + 2] = b;
                target[targetIdx + 3] = a;
            }
        }
    }

    applyPixelation(data, width, height, blockSize) {
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                // Calculate average color for the block
                let r = 0, g = 0, b = 0, a = 0, count = 0;
                
                for (let by = y; by < Math.min(y + blockSize, height); by++) {
                    for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
                        const idx = (by * width + bx) * 4;
                        r += data[idx];
                        g += data[idx + 1];
                        b += data[idx + 2];
                        a += data[idx + 3];
                        count++;
                    }
                }
                
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);
                a = Math.floor(a / count);
                
                // Apply average color to entire block
                for (let by = y; by < Math.min(y + blockSize, height); by++) {
                    for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
                        const idx = (by * width + bx) * 4;
                        data[idx] = r;
                        data[idx + 1] = g;
                        data[idx + 2] = b;
                        data[idx + 3] = a;
                    }
                }
            }
        }
    }

    applyBlackout(data, width, height) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            // Keep alpha unchanged
        }
    }

    applyAdvancedBlur(data, width, height, strength, smartDetection) {
        // Advanced blur with edge preservation
        const radius = Math.min(strength, 30);
        
        if (smartDetection) {
            // Apply edge-preserving blur
            this.applyBilateralFilter(data, width, height, radius);
        } else {
            // Apply standard Gaussian blur
            this.applyGaussianBlur(data, width, height, strength);
        }
    }

    applyBilateralFilter(data, width, height, radius) {
        const temp = new Uint8ClampedArray(data);
        const sigmaSpace = radius / 3;
        const sigmaColor = 50;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, totalWeight = 0;
                const centerIdx = (y * width + x) * 4;
                const centerR = data[centerIdx];
                const centerG = data[centerIdx + 1];
                const centerB = data[centerIdx + 2];
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const ny = Math.max(0, Math.min(height - 1, y + dy));
                        const nx = Math.max(0, Math.min(width - 1, x + dx));
                        const idx = (ny * width + nx) * 4;
                        
                        const spatialWeight = Math.exp(-(dx * dx + dy * dy) / (2 * sigmaSpace * sigmaSpace));
                        
                        const colorDiff = Math.sqrt(
                            Math.pow(data[idx] - centerR, 2) +
                            Math.pow(data[idx + 1] - centerG, 2) +
                            Math.pow(data[idx + 2] - centerB, 2)
                        );
                        const colorWeight = Math.exp(-(colorDiff * colorDiff) / (2 * sigmaColor * sigmaColor));
                        
                        const weight = spatialWeight * colorWeight;
                        
                        r += data[idx] * weight;
                        g += data[idx + 1] * weight;
                        b += data[idx + 2] * weight;
                        totalWeight += weight;
                    }
                }
                
                temp[centerIdx] = r / totalWeight;
                temp[centerIdx + 1] = g / totalWeight;
                temp[centerIdx + 2] = b / totalWeight;
            }
        }
        
        // Copy back
        for (let i = 0; i < data.length; i++) {
            data[i] = temp[i];
        }
    }

    addBlurIndicator(ctx, item, blurType) {
        const { x, y, width, height } = item.coordinates;
        
        // Save context
        ctx.save();
        
        // Draw border
        ctx.strokeStyle = this.getTypeColor(item.type);
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x, y, width, height);
        
        // Draw label
        ctx.fillStyle = this.getTypeColor(item.type);
        ctx.font = 'bold 12px Inter';
        const label = `${item.type} (${Math.round(item.confidence * 100)}%)`;
        const metrics = ctx.measureText(label);
        
        ctx.fillRect(x, y - 20, metrics.width + 10, 20);
        ctx.fillStyle = 'white';
        ctx.fillText(label, x + 5, y - 5);
        
        // Restore context
        ctx.restore();
    }

    getTypeColor(type) {
        const colors = {
            'Email': '#ef4444',
            'Phone': '#f59e0b',
            'Face': '#8b5cf6',
            'Address': '#06b6d4',
            'Credit Card': '#dc2626',
            'SSN': '#991b1b',
            'Name': '#059669',
            'Date': '#0d9488',
            'Number': '#7c3aed',
            'URL': '#2563eb',
            'Custom': '#6366f1'
        };
        return colors[type] || '#6b7280';
    }

    displayResults() {
        // Update processed canvas display
