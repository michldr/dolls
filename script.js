let userName = "";
let dollPhotoURL = "";
let dollThumbnailURL = "";
let currentPhotoIndex = 0;
let currentCityKey = "";
let slideInterval;

// Initialize Firebase
const firebaseConfig = { databaseURL: "https://bubot-mekomiot-default-rtdb.firebaseio.com" };
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- 1. GREEN SCREEN LOGIC ---
document.addEventListener('DOMContentLoaded', function() {
    const dollInput = document.getElementById('doll-photo-input');
    if (!dollInput) return;

    dollInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const statusText = document.getElementById('file-status');
        statusText.innerText = "סטטוס: מעבד צבע ירוק...";

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                dollPhotoURL = removeGreenBackground(img);
                // Create thumbnail from the processed image (green removed)
                const processedImg = new Image();
                processedImg.onload = function() {
                    dollThumbnailURL = createThumbnail(processedImg);
                    statusText.innerText = "סטטוס: הרקע הירוק הוסר בהצלחה! ✓";
                    statusText.style.color = "#00ff00";
                };
                processedImg.src = dollPhotoURL;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
});

// החליפי את הפונקציה removeGreenBackground הישנה בזו:
function removeGreenBackground(imageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxWidth = 800;
    const maxHeight = 1000;
    let width = imageElement.width;
    let height = imageElement.height;

    // שינוי גודל אם התמונה ענקית
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageElement, 0, 0, width, height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // הגדרות רגישות לירוק (Hue)
    const greenHueMin = 70;  
    const greenHueMax = 170;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // המרה ל-HSL לזיהוי גוון מדויק
        const hsl = rgbToHsl(r, g, b);
        const hue = hsl[0] * 360; 
        const sat = hsl[1];
        const light = hsl[2];

        // זיהוי חכם: האם הגוון הוא ירוק והאם הוא מספיק "צבעוני"?
        if (hue >= greenHueMin && hue <= greenHueMax && sat > 0.25 && light > 0.2) {
            
            // "ריכוך" (Feathering) בקצוות
            let alpha = 0;
            if (sat < 0.35) {
                alpha = (0.35 - sat) * 4 * 255; 
            }
            data[i + 3] = alpha; // הופך לשקוף
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

// --- חובה להוסיף גם את פונקציית העזר הזו (אפשר בסוף הקובץ) ---
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // אפור
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function createThumbnail(imageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const thumbWidth = 90;
    const thumbHeight = 120;
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;
    ctx.clearRect(0, 0, thumbWidth, thumbHeight);
    ctx.drawImage(imageElement, 0, 0, thumbWidth, thumbHeight);
    const dataURL = canvas.toDataURL('image/png');
    console.log(`Thumbnail size: ${(dataURL.length / 1024).toFixed(0)} KB`);
    return dataURL;
}

// --- 2. INITIALIZATION (מחובר ל-cities.js המסודר) ---
function initializePortal() {
    const nameInput = document.getElementById('user-name');
    if (!nameInput.value || !dollPhotoURL) {
        alert("נא להזין שם ולהעלות תמונה של בובה");
        return;
    }

    userName = nameInput.value;
    document.getElementById('sync-screen').style.display = 'none';
    document.getElementById('main-interface').style.display = 'block';
    document.getElementById('welcome-message').innerText = `שלום ${userName}, באיזו עיר אתם גרים?`;

    // Position doll at Jerusalem and make it visible
    const dollContainer = document.getElementById('doll-container');
    const dollImg = document.getElementById('map-doll-img');
    const jerusalemCoords = { x: 53.8, y: 41.3 };

    dollContainer.style.left = jerusalemCoords.x + '%';
    dollContainer.style.top = jerusalemCoords.y + '%';

    // Set image source and make visible when loaded
    dollImg.onload = function() {
        dollImg.style.display = 'block';
    };
    dollImg.src = dollPhotoURL;

    const markersLayer = document.getElementById('markers-layer');
    const select = document.getElementById('destination');

    // ניקוי רשימה קיימת לפני מילוי (למניעת כפילויות)
    select.innerHTML = '<option value="">-- בחר עיר --</option>';

    // שימוש ברשימה הממוינת מתוך cities.js
    const sortedCities = window.sortedCitiesList || Object.keys(missionControl).map(k => ({key: k, ...missionControl[k]}));

    // Major cities to show labels for
    const majorCities = [
        "ירושלים", "תל אביב", "חיפה", "באר שבע", "אילת",
        "קרית שמונה", "נתניה", "אשדוד", "אשקלון", "צפת", "טבריה",
        "רמת הגולן", "ים המלח", "הגליל", "נהריה", "עכו"
    ];

    sortedCities.forEach(cityObj => {
        // הוספת נקודה למפה
        // const dot = document.createElement('div');
        // dot.className = 'city-dot';
        // dot.style.left = cityObj.x + '%';
        // dot.style.top = cityObj.y + '%';
        // markersLayer.appendChild(dot);

        // הוספת שם העיר על המפה - רק לערים הגדולות
        // if (majorCities.includes(cityObj.name)) {
        //     const label = document.createElement('div');
        //     label.className = 'city-label';
        //     label.innerText = cityObj.name;
        //     label.style.left = cityObj.x + '%';
        //     label.style.top = cityObj.y + '%';
        //     markersLayer.appendChild(label);
        // }

        // הוספת אופציה לתפריט (הסדר כאן נקבע ע"י המערך הממוין)
        const opt = document.createElement('option');
        opt.value = cityObj.key;
        opt.innerText = cityObj.name;
        select.appendChild(opt);
    });
}

// --- 3. TRAVEL & MODAL LOGIC ---
function startTravel(key) {
    if (!key) return;
    currentCityKey = key;
    const target = missionControl[key];
    const dollContainer = document.getElementById('doll-container');
    const dollImg = document.getElementById('map-doll-img');
    const zoomContainer = document.getElementById('map-zoom-container');

    // UPDATED COORDS FOR NEW MAP
    const jerusalemCoords = { x: 52.5, y: 40.0 };
    const correctCoords = { x: target.x, y: target.y };

    dollContainer.style.left = jerusalemCoords.x + '%';
    dollContainer.style.top = jerusalemCoords.y + '%';
    dollImg.style.display = 'block';

    // Step 2: Travel from Jerusalem to destination city (2 seconds)
    setTimeout(() => {
        dollContainer.style.left = correctCoords.x + '%';
        dollContainer.style.top = correctCoords.y + '%';
    }, 100);

    // Step 3: After travel, zoom into the destination
    setTimeout(() => {
        const scale = 5;
        // Set transform origin to the city coordinates, then scale to zoom in on that exact point
        zoomContainer.style.transformOrigin = `${correctCoords.x}% ${correctCoords.y}%`;
        zoomContainer.style.transform = `scale(${scale})`;

        // Step 4: Flash and show selfie
        setTimeout(() => {
            document.getElementById('flash').style.opacity = '1';
            setTimeout(() => {
                document.getElementById('flash').style.opacity = '0';
                showTravelSelfie(key);
            }, 100);
        }, 1600);
    }, 2100);
}

function showTravelSelfie(key) {
    const city = missionControl[key];
    if (!city) return; // הגנה למקרה שהעיר לא נמצאה
    
    clearInterval(slideInterval);

    // התיקון הקריטי: משתמשים ב-images במקום photos
    const currentImages = (city.images && city.images.length > 0) ? city.images : ["img/default-city.jpg"];
    
    currentPhotoIndex = 0;
    const bgElement = document.getElementById('city-bg');
    
    // הצגת התמונה הראשונה מיד
    bgElement.src = currentImages[0];

    // עיבוד העובדות (Facts) לרשימה
    const factsHTML = Array.isArray(city.facts) ? 
        `<ul>${city.facts.map(f => `<li>${f}</li>`).join('')}</ul>` : 
        `<ul><li>${city.fact || "אין מידע זמין."}</li></ul>`;

    document.getElementById('city-fact').innerHTML = factsHTML;
    document.getElementById('selfie-doll-img').src = dollPhotoURL;
    document.getElementById('city-name').innerText = city.name;
    document.getElementById('travel-report').style.display = 'flex';

    // הפעלת מצגת אם יש יותר מתמונה אחת (כמו בירושלים)
    if (currentImages.length > 1) {
        slideInterval = setInterval(() => {
            currentPhotoIndex = (currentPhotoIndex + 1) % currentImages.length;
            bgElement.src = currentImages[currentPhotoIndex];
        }, 3000); // החלפת תמונה כל 3 שניות
    }
}

function closeTravel() {
    clearInterval(slideInterval);
    const zoomContainer = document.getElementById('map-zoom-container');
    document.getElementById('travel-report').style.display = 'none';
    zoomContainer.style.transform = 'scale(1)';
    zoomContainer.style.transformOrigin = 'center center';
    document.getElementById('destination').value = "";
    document.getElementById('map-doll-img').style.display = 'none';
}

function showConfirmDialog() {
    if (currentCityKey) document.getElementById('confirm-dialog').style.display = 'flex';
}

function closeConfirmDialog() {
    document.getElementById('confirm-dialog').style.display = 'none';
}

function confirmCitySelection() {
    const city = missionControl[currentCityKey];

    console.log("=== confirmCitySelection called ===");
    console.log("currentCityKey:", currentCityKey);
    console.log("city object:", city);
    console.log("userName:", userName);
    console.log("dollPhotoURL exists:", !!dollPhotoURL);
    console.log("dollPhotoURL length:", dollPhotoURL ? dollPhotoURL.length : 0);

    // Check if we have all required data
    if (!userName) {
        alert("שגיאה: לא הוזן שם");
        console.error("Validation failed: no userName");
        return;
    }
    if (!dollPhotoURL) {
        alert("שגיאה: לא הועלתה תמונת בובה");
        console.error("Validation failed: no dollPhotoURL");
        return;
    }
    if (!city) {
        alert("שגיאה: לא נבחרה עיר");
        console.error("Validation failed: no city");
        return;
    }

    // Close the confirm dialog
    closeConfirmDialog();

    // Validate image data
    const imageToUpload = dollThumbnailURL || dollPhotoURL;
    if (!imageToUpload.startsWith('data:image/')) {
        alert("שגיאה: נתוני התמונה לא תקינים");
        return;
    }

    // Save upload data to localStorage and redirect immediately
    // map.html will handle the actual Firebase upload in the background
    const uploadData = {
        city: city.name,
        image: imageToUpload,
        userName: userName,
        time: Date.now(),
        uploadId: Date.now() + '_' + Math.random().toString(36).substring(2, 11)
    };

    localStorage.setItem('pendingUpload', JSON.stringify(uploadData));
    window.location.href = 'map.html';
}
