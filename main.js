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

        // Personal
