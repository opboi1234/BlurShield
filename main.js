class PrivacyShield {
    constructor() {
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.originalImageData = null;
        this.currentImage = null;
        this.blurStrength = 10;
        this.userName = '';
        this.detectedItems = [];
        
        this.initializeEventListeners();
        this.setupRegexPatterns();
    }
    
    setupRegexPatterns() {
        this.patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
            creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
            address: /\b\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi
        };
    }
    
    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const processBtn = document.getElementById('processBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const blurStrength = document.getElementById('blurStrength');
        const blurNamesCheckbox = document.getElementById('blurNames');
        const nameModal = document.getElementById('nameModal');
        const confirmNameBtn = document.getElementById('confirmName');
        const cancelNameBtn = document.getElementById('cancelName');
        
        // Upload area events
        uploadArea.addEventListener('click', () => imageInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        
        // File input
        imageInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Process button
        processBtn.addEventListener('click', this.processImage.bind(this));
        
        // Download button
        downloadBtn.addEventListener('click', this.downloadImage.bind(this));
        
        // Blur strength slider
        blurStrength.addEventListener('input', (e) => {
            this.blurStrength = parseInt(e.target.value);
            document.getElementById('blurValue').textContent = this.blurStrength;
            if (this.detectedItems.length > 0) {
                this.applyBlurring();
            }
        });
        
        // Name checkbox
        blurNamesCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                nameModal.style.display = 'flex';
            } else {
                this.userName = '';
            }
        });
        
        // Name modal events
        confirmNameBtn.addEventListener('click', () => {
            this.userName = document.getElementById('userNameInput').value.trim();
            nameModal.style.display = 'none';
            if (!this.userName) {
                blurNamesCheckbox.checked = false;
            }
        });
        
        cancelNameBtn.addEventListener('click', () => {
            nameModal.style.display = 'none';
            blurNamesCheckbox.checked = false;
            document.getElementById('userNameInput').value = '';
        });
    }
    
    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.loadImage(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }
    
    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.setupCanvas(img);
                this.showControls();
            };
            img.src = e.target.result;
        };
        reader.readAsDataFile(file);
    }
    
    setupCanvas(img) {
        // Resize image to fit container while maintaining aspect ratio
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = img;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.ctx.drawImage(img, 0, 0, width, height);
        this.originalImageData = this.ctx.getImageData(0, 0, width, height);
        
        document.getElementById('canvasContainer').style.display = 'block';
    }
    
    showControls() {
        document.getElementById('privacyOptions').style.display = 'grid';
        document.getElementById('controls').style.display = 'block';
    }
    
    async processImage() {
        if (!this.currentImage) return;
        
        this.showLoading(true);
        this.detectedItems = [];
        
        try {
            // Use Tesseract.js to extract text
            const { data: { text, words } } = await Tesseract.recognize(this.canvas, 'eng', {
                logger: m => console.log(m)
            });
            
            console.log('Extracted text:', text);
            
            // Find sensitive information
            await this.detectSensitiveInfo(text, words);
            
            // Apply blurring
            this.applyBlurring();
            
            document.getElementById('downloadBtn').style.display = 'inline-block';
            
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }
    
    async detectSensitiveInfo(text, words) {
        const checkboxes = {
            blurEmails: document.getElementById('blurEmails').checked,
            blurPhones: document.getElementById('blurPhones').checked,
            blurCards: document.getElementById('blurCards').checked,
            blurAddresses: document.getElementById('blurAddresses').checked,
            blurNames: document.getElementById('blurNames').checked && this.userName
        };
        
        // Process each word with its bounding box
        words.forEach(word => {
            const wordText = word.text;
            const bbox = word.bbox;
            
            // Scale bounding box to canvas size
            const scaleX = this.canvas.width / word.page.width;
            const scaleY = this.canvas.height / word.page.height;
            
            const scaledBbox = {
                x0: bbox.x0 * scaleX,
                y0: bbox.y0 * scaleY,
                x1: bbox.x1 * scaleX,
                y1: bbox.y1 * scaleY
            };
            
            // Check for emails
            if (checkboxes.blurEmails && this.patterns.email.test(wordText)) {
                this.detectedItems.push({
                    type: 'email',
                    bbox: scaledBbox,
                    text: wordText
                });
            }
            
            // Check for phone numbers
            if (checkboxes.blurPhones && this.patterns.phone.test(wordText)) {
                this.detectedItems.push({
                    type: 'phone',
                    bbox: scaledBbox,
                    text: wordText
                });
            }
            
            // Check for credit cards
            if (checkboxes.blurCards && this.patterns.creditCard.test(wordText)) {
                this.detectedItems.push({
                    type: 'creditCard',
                    bbox: scaledBbox,
                    text: wordText
                });
            }
            
            // Check for addresses
            if (checkboxes.blurAddresses && this.patterns.address.test(wordText)) {
                this.detectedItems.push({
                    type: 'address',
                    bbox: scaledBbox,
                    text: wordText
                });
            }
            
            // Check for user name
            if (checkboxes.blurNames && this.userName && 
                wordText.toLowerCase().includes(this.userName.toLowerCase())) {
                this.detectedItems.push({
                    type: 'name',
                    bbox: scaledBbox,
                    text: wordText
                });
            }
        });
        
        // Simulate face detection (placeholder - you could integrate face-api.js here)
        if (document.getElementById('blurFaces').checked) {
            // Add some mock face detection areas
            this.detectedItems.push({
                type: 'face',
                bbox: {
                    x0: this.canvas.width * 0.1,
                    y0: this.canvas.height * 0.1,
                    x1: this.canvas.width * 0.3,
                    y1: this.canvas.height * 0.4
                },
                text: 'Face detected'
            });
        }
        
        console.log('Detected items:', this.detectedItems);
    }
    
    applyBlurring() {
        // Restore original image
        this.ctx.putImageData(this.originalImageData, 0, 0);
        
        // Apply blur to detected areas
        this.detectedItems.forEach(item => {
            this.blurArea(item.bbox);
        });
    }
    
    blurArea(bbox) {
        const x = Math.floor(bbox.x0);
        const y = Math.floor(bbox.y0);
        const width = Math.ceil(bbox.x1 - bbox.x0);
        const height = Math.ceil(bbox.y1 - bbox.y0);
        
        // Create a temporary canvas for blurring
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // Copy the area to temp canvas
        const imageData = this.ctx.getImageData(x, y, width, height);
        tempCtx.putImageData(imageData, 0, 0);
        
        // Apply CSS filter blur
        tempCtx.filter = `blur(${this.blurStrength}px)`;
        tempCtx.drawImage(tempCanvas, 0, 0);
        
        // Draw blurred area back to main canvas
        this.ctx.drawImage(tempCanvas, x, y);
        
        // Draw black border around blurred area
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    downloadImage() {
        const link = document.createElement('a');
        link.download = 'privacy-cleaned-screenshot.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
        document.getElementById('processBtn').disabled = show;
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PrivacyShield();
});
