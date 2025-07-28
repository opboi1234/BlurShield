const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const blurStrengthSlider = document.getElementById('blurStrength');
const blurValueLabel = document.getElementById('blurValue');
const imageInput = document.getElementById('imageInput');
const blurMessage = document.getElementById('blurMessage');

let originalImage = null;

blurStrengthSlider.oninput = () => {
  blurValueLabel.textContent = blurStrengthSlider.value;
};

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    originalImage = img;
  };
  img.src = URL.createObjectURL(file);
});

function getBlurOptions() {
  return {
    emails: document.getElementById('blurEmails').checked,
    phones: document.getElementById('blurPhones').checked,
    cards: document.getElementById('blurCards').checked,
    names: document.getElementById('blurNames').checked,
    addresses: document.getElementById('blurAddresses').checked,
    faces: document.getElementById('blurFaces').checked,
    nameValue: document.getElementById('nameInput').value.trim()
  };
}

async function processImage() {
  if (!originalImage) return;

  ctx.drawImage(originalImage, 0, 0);
  blurMessage.textContent = 'Scanning and blacking out...';

  const padding = parseInt(blurStrengthSlider.value);
  const options = getBlurOptions();

  await detectText(canvas, padding, options);
  if (options.faces) await detectFaces(canvas, padding);

  blurMessage.textContent = 'Sensitive info hidden!';
}

async function detectText(canvas, padding, options) {
  const { data: { words } } = await Tesseract.recognize(canvas, 'eng');

  words.forEach(word => {
    const value = word.text.trim();
    const box = word.bbox;
    if (shouldBlur(value, options)) {
      blackBoxArea(box.x0 - padding, box.y0 - padding, (box.x1 - box.x0) + 2*padding, (box.y1 - box.y0) + 2*padding);
    }
  });
}

function shouldBlur(value, options) {
  // Remove non-alphanumeric characters for name comparison
  const cleanValue = value.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  
  return (
    (options.phones && /\d{3}[\s-]?\d{3}[\s-]?\d{4}/.test(value)) ||
    (options.emails && /[\w.-]+@[\w.-]+\.[a-z]{2,}/i.test(value)) ||
    (options.cards && /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/.test(value)) ||
    (options.addresses && /\d{1,5} [\w ]+ (Street|St|Ave|Road|Rd|Boulevard|Blvd)/i.test(value)) ||
    (options.names && options.nameValue && isNameMatch(cleanValue, options.nameValue))
  );
}

function isNameMatch(detectedText, targetName) {
  if (!targetName || !detectedText) return false;
  
  const targetLower = targetName.toLowerCase().trim();
  const detectedLower = detectedText.toLowerCase().trim();
  
  // Check for exact match
  if (detectedLower === targetLower) return true;
  
  // Check if the detected text contains the name (for partial matches)
  if (detectedLower.includes(targetLower)) return true;
  
  // Check if the name contains the detected text (for when OCR breaks up the name)
  if (targetLower.includes(detectedLower) && detectedLower.length > 2) return true;
  
  // Split names and check individual parts
  const targetParts = targetLower.split(/\s+/);
  const detectedParts = detectedLower.split(/\s+/);
  
  for (const targetPart of targetParts) {
    if (targetPart.length > 2) { // Only check parts longer than 2 characters
      for (const detectedPart of detectedParts) {
        if (detectedPart === targetPart || 
            (detectedPart.includes(targetPart) && targetPart.length > 3) ||
            (targetPart.includes(detectedPart) && detectedPart.length > 3)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Draw a solid black box for privacy
function blackBoxArea(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'black';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

async function detectFaces(canvas, padding) {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');

    const detections = await faceapi.detectAllFaces(canvas, 
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
    );

    detections.forEach(detection => {
      const box = detection.box;
      blackBoxArea(
        box.x - padding, 
        box.y - padding, 
        box.width + 2 * padding, 
        box.height + 2 * padding
      );
    });
  } catch (error) {
    console.error('Face detection error:', error);
    blurMessage.textContent += ' (Face detection failed)';
  }
}

function downloadImage() {
  if (!canvas.width || !canvas.height) {
    alert('No image to download!');
    return;
  }

  const link = document.createElement('a');
  link.download = 'blurred-image.png';
  link.href = canvas.toDataURL();
  link.click();
}
