// BlurShield main.js
const imageUpload = document.getElementById('imageUpload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const blurSlider = document.getElementById('blurSlider');
const blurValue = document.getElementById('blurValue');
const loading = document.getElementById('loading');
const downloadBtn = document.getElementById('downloadBtn');
const placeholder = document.getElementById('placeholder');

let originalImage = null;
let detectedRects = [];
let detectedFaces = [];
let blurStrength = parseInt(blurSlider.value);

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}
function showPlaceholder(show) {
    placeholder.style.display = show ? 'flex' : 'none';
}
function showDownload(show) {
    downloadBtn.style.display = show ? 'inline-block' : 'none';
}
function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showPlaceholder(true);
    showDownload(false);
}

function drawImage(img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    showPlaceholder(false);
}

function drawBlurRects(rects) {
    rects.forEach(rect => {
        ctx.save();
        ctx.filter = `blur(${blurStrength}px)`;
        ctx.drawImage(canvas, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
        ctx.restore();
        // Draw bounding box
        ctx.save();
        ctx.strokeStyle = '#ffb347';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        ctx.restore();
    });
}

function drawFaceRects(faces) {
    faces.forEach(face => {
        const { x, y, w, h } = face;
        ctx.save();
        ctx.filter = `blur(${blurStrength}px)`;
        ctx.drawImage(canvas, x, y, w, h, x, y, w, h);
        ctx.restore();
        // Draw bounding box
        ctx.save();
        ctx.strokeStyle = '#4e54c8';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
    });
}

function processImage(img) {
    showLoading(true);
    drawImage(img);
    detectedRects = [];
    detectedFaces = [];
    // OCR with Tesseract
    Tesseract.recognize(img, 'eng', { logger: m => {} })
        .then(({ data }) => {
            // Find private info
            data.words.forEach(word => {
                const text = word.text;
                const bbox = word.bbox;
                if (isPrivateInfo(text)) {
                    // Map bbox to canvas size
                    const x = bbox.x0 * canvas.width / img.width;
                    const y = bbox.y0 * canvas.height / img.height;
                    const w = (bbox.x1 - bbox.x0) * canvas.width / img.width;
                    const h = (bbox.y1 - bbox.y0) * canvas.height / img.height;
                    detectedRects.push({ x, y, w, h });
                }
            });
            // Face detection
            faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights')
                .then(() => faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions()))
                .then(faces => {
                    faces.forEach(face => {
                        const box = face.box;
                        // Map box to canvas size
                        const x = box.x * canvas.width / img.width;
                        const y = box.y * canvas.height / img.height;
                        const w = box.width * canvas.width / img.width;
                        const h = box.height * canvas.height / img.height;
                        detectedFaces.push({ x, y, w, h });
                    });
                    // Blur detected regions
                    drawBlurRects(detectedRects);
                    drawFaceRects(detectedFaces);
                    showLoading(false);
                    showDownload(true);
                });
        });
}

function isPrivateInfo(text) {
    // Regex for emails, phones, credit cards, names, addresses
    const email = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phone = /\b(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}\b/;
    const credit = /\b(?:\d[ -]*?){13,16}\b/;
    const name = /^[A-Z][a-z]+ [A-Z][a-z]+$/;
    const address = /\d+ [A-Za-z ]+,? [A-Za-z ]+/;
    return email.test(text) || phone.test(text) || credit.test(text) || name.test(text) || address.test(text);
}

imageUpload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        originalImage = img;
        processImage(img);
    };
    img.src = URL.createObjectURL(file);
});

blurSlider.addEventListener('input', e => {
    blurStrength = parseInt(e.target.value);
    blurValue.textContent = blurStrength;
    if (originalImage) {
        processImage(originalImage);
    }
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'blurred.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

resetCanvas();
