// Enhanced Auto-Privacy Screenshot Cleaner with Cool Features
class PrivacyScreenshotCleaner {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.bindEvents();
        this.loadFaceApiModels();
        this.setupProgressRing();
    }
//k
    initializeElements() {
        // File upload elements
        this.imageUpload = document.getElementById('imageUpload');
        this.uploadSection = document.getElementById('uploadSection');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.cameraBtn = document.getElementById('cameraBtn');
        
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
        this.blurStrength = parseInt(this.blurSlider.value);
        this.userName = '';
        this.customText = '';
        this.faceApiLoaded = false;
        this.startTime = null;
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
        this.imageUpload.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadSection.addEventListener('click', () => this.imageUpload.click());
        this.uploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadSection.addEventListener('dragleave', () => this.uploadSection.classList.remove('dragover'));

        // New feature events
        this.pasteBtn.addEventListener('click', () => this.handlePasteFromClipboard());
        this.cameraBtn.addEventListener('click', () => this.handleCameraCapture());
        this.beforeAfterMode.addEventListener('change', (e) => this.toggleBeforeAfterMode(e.target.checked));

        // Control events
        this.blurSlider.addEventListener('input', (e) => this.handleBlurChange(e));
        this.blurStyle.addEventListener('change', () => this.reprocessImage());
        this.blurNameCheck.addEventListener('change', (e) => this.handleNameBlurToggle(e));
        this.userNameInput.addEventListener('input', (e) => this.handleNameInput(e));
        this.detectCustom.addEventListener('change', (e) => this.handleCustomTextToggle(e));
        this.customTextInput.addEventListener('input', (e) => this.handleCustomTextInput(e));
        
        // Detection setting changes
        [this.detectEmails, this.detectPhones, this.detectFaces, this.detectAddresses, 
         this.detectCreditCards, this.detectSSN].forEach(checkbox => 
            checkbox.addEventListener('change', () => this.reprocessImage()));

        // Button events
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.downloadOriginalBtn.addEventListener('click', () => this.downloadOriginalImage());
        this.undoBtn.addEventListener('click', () => this.undoLastAction());
        this.resetBtn.addEventListener('click', () => this.resetAll());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
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
