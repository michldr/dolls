let userName = "";
let dollPhotoURL = "";
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
                statusText.innerText = "סטטוס: הרקע הירוק הוסר בהצלחה! ✓";
                statusText.style.color = "#00ff00";
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
});

function removeGreenBackground(imageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (g > 100 && g > r * 1.4 && g > b * 1.4) {
            data[i + 3] = 0; 
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
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
    document.getElementById('map-doll-img').src = dollPhotoURL;

    const markersLayer = document.getElementById('markers-layer');
    const select = document.getElementById('destination');

    // ניקוי רשימה קיימת לפני מילוי (למניעת כפילויות)
    select.innerHTML = '<option value="">-- בחר עיר --</option>';

    // שימוש ברשימה הממוינת מתוך cities.js
    const sortedCities = window.sortedCitiesList || Object.keys(missionControl).map(k => ({key: k, ...missionControl[k]}));

    sortedCities.forEach(cityObj => {
        // הוספת נקודה למפה
        const dot = document.createElement('div');
        dot.className = 'city-dot';
        dot.style.left = cityObj.x + '%';
        dot.style.top = cityObj.y + '%';
        markersLayer.appendChild(dot);

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
    const zoomContainer = document.getElementById('map-zoom-container');

    // Use correct map coordinates for positioning - matches map.html cityCoords
    const mapCoords = {
        "ירושלים": { x: 52.2, y: 44.7 },
        "תל אביב": { x: 44.0, y: 38.3 },
        "חיפה": { x: 48.1, y: 23.2 },
        "באר שבע": { x: 44.1, y: 55.9 },
        "צפת": { x: 55.5, y: 18.5 },
        "טבריה": { x: 56.1, y: 22.1 },
        "נהריה": { x: 49.5, y: 18.0 },
        "עכו": { x: 49.0, y: 20.0 },
        "נתניה": { x: 45.4, y: 33.1 },
        "כפר סבא": { x: 47.5, y: 35.8 },
        "רעננה": { x: 46.2, y: 35.5 },
        "הרצליה": { x: 45.0, y: 36.5 },
        "חדרה": { x: 46.5, y: 31.0 },
        "פתח תקווה": { x: 47.2, y: 38.0 },
        "רמת גן": { x: 45.2, y: 37.8 },
        "גבעתיים": { x: 45.1, y: 38.5 },
        "בני ברק": { x: 45.8, y: 37.9 },
        "חולון": { x: 44.5, y: 39.8 },
        "בת ים": { x: 43.8, y: 39.5 },
        "ראשון לציון": { x: 44.8, y: 41.2 },
        "נס ציונה": { x: 44.9, y: 42.5 },
        "רחובות": { x: 45.1, y: 43.8 },
        "מודיעין": { x: 49.5, y: 41.5 },
        "אשדוד": { x: 41.6, y: 44.2 },
        "אשקלון": { x: 39.5, y: 47.5 },
        "אילת": { x: 47.1, y: 91.4 },
        "רמת הגולן": { x: 56.5, y: 15.0 },
        "ים המלח": { x: 57.0, y: 50.0 },
        "הגליל": { x: 53.0, y: 17.0 },
        "הערבה": { x: 50.0, y: 75.0 },
        "עוטף עזה": { x: 37.0, y: 50.0 },
        "עמק יזרעאל": { x: 52.0, y: 26.0 }
    };

    const correctCoords = mapCoords[target.name] || { x: target.x, y: target.y };
    dollContainer.style.left = correctCoords.x + '%';
    dollContainer.style.top = correctCoords.y + '%';

    setTimeout(() => {
        const zX = (50 - correctCoords.x) * 4.5;
        const zY = (40 - correctCoords.y) * 4.5;
        zoomContainer.style.transform = `scale(5) translate(${zX}%, ${zY}%)`;

        setTimeout(() => {
            document.getElementById('flash').style.opacity = '1';
            setTimeout(() => {
                document.getElementById('flash').style.opacity = '0';
                showTravelSelfie(key);
            }, 100);
        }, 1600);
    }, 1000);
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
    document.getElementById('travel-report').style.display = 'none';
    document.getElementById('map-zoom-container').style.transform = 'scale(1) translate(0,0)';
    document.getElementById('destination').value = "";
}

function showConfirmDialog() {
    if (currentCityKey) document.getElementById('confirm-dialog').style.display = 'flex';
}

function closeConfirmDialog() {
    document.getElementById('confirm-dialog').style.display = 'none';
}

function confirmCitySelection() {
    const city = missionControl[currentCityKey];

    console.log("Confirming city:", city.name);
    console.log("User:", userName);
    console.log("Photo URL length:", dollPhotoURL ? dollPhotoURL.length : 0);

    // Upload to Firebase
    database.ref('uploads').push({
        city: city.name,
        image: dollPhotoURL,
        userName: userName,
        time: Date.now()
    }).then(() => {
        console.log("Upload successful, redirecting...");
        // Redirect to map after successful upload
        window.location.href = 'map.html';
    }).catch((error) => {
        console.error("Upload error:", error);
        alert("שגיאה בשמירת הנתונים: " + error.message);
    });
}
