<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BlurShield - AI-Powered Privacy Protection</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #3b82f6;
            --secondary-color: #64748b;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --danger-color: #ef4444;
            --bg-color: #ffffff;
            --surface-color: #f8fafc;
            --text-color: #1e293b;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }

        [data-theme="dark"] {
            --bg-color: #0f172a;
            --surface-color: #1e293b;
            --text-color: #f1f5f9;
            --text-muted: #94a3b8;
            --border-color: #334155;
            --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3);
            --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.3);
        }

        * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .navbar {
            background-color: var(--surface-color) !important;
            border-bottom: 1px solid var(--border-color);
            box-shadow: var(--shadow);
        }

        .navbar-brand {
            color: var(--primary-color) !important;
            font-weight: 700;
        }

        .card {
            background-color: var(--surface-color);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow);
        }

        .upload-area {
            border: 2px dashed var(--border-color);
            background-color: var(--surface-color);
            border-radius: 12px;
            padding: 3rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .upload-area:hover {
            border-color: var(--primary-color);
            background-color: var(--bg-color);
        }

        .upload-area.dragover {
            border-color: var(--primary-color);
            background-color: rgba(59, 130, 246, 0.1);
        }

        .upload-icon {
            font-size: 4rem;
            color: var(--text-muted);
            margin-bottom: 1rem;
        }

        .quick-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
            justify-content: center;
        }

        .quick-action-btn {
            background-color: var(--surface-color);
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
        }

        .quick-action-btn:hover {
            background-color: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .canvas-container {
            position: relative;
            text-align: center;
            background-color: var(--surface-color);
            border-radius: 12px;
            padding: 1rem;
            border: 1px solid var(--border-color);
        }

        #canvas, #beforeCanvas, #afterCanvas {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
        }

        .before-after-container {
            display: none;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 1rem;
        }

        .before-after-label {
            text-align: center;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-muted);
        }

        .controls-section {
            background-color: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
        }

        .blur-preview {
            width: 100px;
            height: 30px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            margin-left: 1rem;
        }

        .detection-stats {
            display: none;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .stat-card {
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
        }

        .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary-color);
        }

        .stat-label {
            font-size: 0.875rem;
            color: var(--text-muted);
            margin-top: 0.25rem;
        }

        .detected-items {
            display: none;
            margin-top: 1rem;
        }

        .detected-item {
            display: inline-block;
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 0.25rem 0.5rem;
            margin: 0.25rem;
            font-size: 0.875rem;
            color: var(--text-muted);
        }

        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }

        .loading-content {
            background-color: var(--surface-color);
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            max-width: 300px;
        }

        .loading-spinner {
            width: 3rem;
            height: 3rem;
            border: 3px solid var(--border-color);
            border-top: 3px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .progress {
            background-color: var(--border-color);
        }

        .progress-bar {
            background-color: var(--primary-color);
        }

        .btn-primary {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
        }

        .btn-outline-primary {
            color: var(--primary-color);
            border-color: var(--primary-color);
        }

        .btn-outline-primary:hover {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
        }

        .form-control, .form-select {
            background-color: var(--bg-color);
            border-color: var(--border-color);
            color: var(--text-color);
        }

        .form-control:focus, .form-select:focus {
            background-color: var(--bg-color);
            border-color: var(--primary-color);
            color: var(--text-color);
            box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
        }

        .form-check-input:checked {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
        }

        .toast {
            background-color: var(--surface-color);
            border: 1px solid var(--border-color);
            color: var(--text-color);
        }

        .theme-toggle {
            background: none;
            border: 1px solid var(--border-color);
            color: var(--text-color);
            border-radius: 8px;
            padding: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .theme-toggle:hover {
            background-color: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .placeholder {
            color: var(--text-muted);
        }

        @media (max-width: 768px) {
            .upload-area {
                padding: 2rem 1rem;
                min-height: 200px;
            }

            .quick-actions {
                flex-direction: column;
                align-items: center;
            }

            .detection-stats {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg">
        <div class="container">
            <a class="navbar-brand" href="#">
                <i class="bi bi-shield-check"></i> BlurShield
            </a>
            <div class="d-flex align-items-center">
                <button class="theme-toggle me-3" id="themeToggle">
                    <i class="bi bi-moon"></i>
                </button>
                <span class="navbar-text">AI-Powered Privacy Protection</span>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <!-- Upload Section -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title mb-3">
                            <i class="bi bi-cloud-upload"></i> Upload Image
                        </h5>
                        
                        <div class="upload-area" id="uploadArea">
                            <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                            <div class="upload-icon">
                                <i class="bi bi-cloud-upload"></i>
                            </div>
                            <h5>Drop your image here or click to browse</h5>
                            <p class="text-muted">Supports JPG, PNG, GIF up to 10MB</p>
                            
                            <div class="quick-actions">
                                <button class="quick-action-btn" id="browseBtn">
                                    <i class="bi bi-folder2-open"></i> Browse Files
                                </button>
                                <button class="quick-action-btn" id="pasteBtn">
                                    <i class="bi bi-clipboard"></i> Paste from Clipboard
                                </button>
                                <button class="quick-action-btn" id="cameraBtn">
                                    <i class="bi bi-camera"></i> Take Photo
                                </button>
                            </div>
                        </div>

                        <div class="progress mt-3" id="uploadProgress" style="display: none;">
                            <div class="progress-bar" id="uploadProgressBar" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="row">
            <!-- Canvas Section -->
            <div class="col-lg-8 mb-4">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-image"></i> Image Preview
                            </h5>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="beforeAfterMode">
                                <label class="form-check-label" for="beforeAfterMode">
                                    Before/After View
                                </label>
                            </div>
                        </div>

                        <div class="canvas-container">
                            <div id="placeholder" class="placeholder">
                                <i class="bi bi-image" style="font-size: 4rem; color: var(--text-muted);"></i>
                                <p class="mt-2">Upload an image to get started</p>
                            </div>
                            <canvas id="canvas" style="display: none;"></canvas>
                            
                            <div class="before-after-container" id="beforeAfterContainer">
                                <div>
                                    <div class="before-after-label">Before</div>
                                    <canvas id="beforeCanvas"></canvas>
                                </div>
                                <div>
                                    <div class="before-after-label">After</div>
                                    <canvas id="afterCanvas"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="d-flex gap-2 mt-3 flex-wrap">
                            <button class="btn btn-primary" id="downloadBtn" style="display: none;">
                                <i class="bi bi-download"></i> Download Protected
                            </button>
                            <button class="btn btn-outline-primary" id="downloadOriginalBtn" style="display: none;">
                                <i class="bi bi-file-earmark-image"></i> Download Original
                            </button>
                            <button class="btn btn-outline-secondary" id="undoBtn" style="display: none;">
                                <i class="bi bi-arrow-counterclockwise"></i> Undo
                            </button>
                            <button class="btn btn-outline-danger" id="resetBtn" style="display: none;">
                                <i class="bi bi-arrow-clockwise"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Detection Stats -->
                <div class="detection-stats" id="detectionStats">
                    <div class="stat-card">
                        <div class="stat-number" id="textDetections">0</div>
                        <div class="stat-label">Text Items</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="faceDetections">0</div>
                        <div class="stat-label">Faces</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="totalDetections">0</div>
                        <div class="stat-label">Total Items</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="processingTime">0</div>
                        <div class="stat-label">Seconds</div>
                    </div>
                </div>

                <!-- Detected Items -->
                <div class="detected-items" id="detectedItemsList">
                    <h6 class="mt-3 mb-2">Detected Items:</h6>
                    <div id="detectedItemsContent"></div>
                </div>
            </div>

            <!-- Controls Section -->
            <div class="col-lg-4">
                <div class="controls-section mb-4">
                    <h5 class="mb-3">
                        <i class="bi bi-sliders"></i> Blur Settings
                    </h5>
                    
                    <div class="mb-3">
                        <label class="form-label">Blur Strength: <span id="blurValue">10</span>px</label>
                        <div class="d-flex align-items-center">
                            <input type="range" class="form-range" id="blurSlider" min="5" max="50" value="10">
                            <canvas class="blur-preview" id="blurPreviewSample" width="100" height="30"></canvas>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Blur Style</label>
                        <select class="form-select" id="blurStyle">
                            <option value="gaussian">Gaussian Blur</option>
                            <option value="pixelate">Pixelate</option>
                            <option value="blackout">Black Box</option>
                        </select>
                    </div>
                </div>

                <div class="controls-section mb-4">
                    <h5 class="mb-3">
                        <i class="bi bi-eye-slash"></i> Detection Settings
                    </h5>
                    
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="detectEmails" checked>
                        <label class="form-check-label" for="detectEmails">
                            <i class="bi bi-envelope"></i> Email Addresses
                        </label>
                    </div>
                    
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="detectPhones" checked>
                        <label class="form-check-label" for="detectPhones">
                            <i class="bi bi-telephone"></i> Phone Numbers
                        </label>
                    </div>
                    
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="detectFaces" checked>
                        <label class="form-check-label" for="detectFaces">
                            <i class="bi bi-person"></i> Faces
                        </label>
                    </div>
                    
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="detectAddresses">
                        <label class="form-check-label" for="detectAddresses">
                            <i class="bi bi-geo-alt"></i> Addresses
                        </label>
                    </div>
                    
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="detectCreditCards">
                        <label class="form-check-label" for="detectCreditCards">
                            <i class="bi bi-credit-card"></i> Credit Cards
                        </label>
                    </div>
                    
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="detectSSN">
                        <label class="form-check-label" for="detectSSN">
                            <i class="bi bi-shield-lock"></i> Social Security Numbers
                        </label>
                    </div>

                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="blurNameCheck">
                        <label class="form-check-label" for="blurNameCheck">
                            <i class="bi bi-person-badge"></i> Blur My Name
                        </label>
                    </div>
                    <input type="text" class="form-control mb-3" id="userNameInput" placeholder="Enter your name" style="display: none;">

                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="detectCustom">
                        <label class="form-check-label" for="detectCustom">
                            <i class="bi bi-search"></i> Custom Text
                        </label>
                    </div>
                    <input type="text" class="form-control" id="customTextInput" placeholder="Enter custom text to blur" style="display: none;">
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <h5 id="loadingText">Processing...</h5>
            <p class="text-muted" id="loadingSubtext">Please wait</p>
        </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastContainer"></div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
    <script src="main.js"></script>
</body>
</html>
