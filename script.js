let userName = "";
let dollPhotoURL = "";
let currentPhotoIndex = 0;
let currentCityKey = "";
let slideInterval;

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

    dollContainer.style.left = target.x + '%';
    dollContainer.style.top = target.y + '%';

    setTimeout(() => {
        const zX = (50 - target.x) * 4.5;
        const zY = (40 - target.y) * 4.5;
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
    clearInterval(slideInterval);

    const photos = (city.photos && city.photos.length > 0) ? city.photos : ["img/default-city.jpg"];
    currentPhotoIndex = 0;
    document.getElementById('city-bg').src = photos[0];

    const factsHTML = Array.isArray(city.facts) ? 
        `<ul>${city.facts.map(f => `<li>${f}</li>`).join('')}</ul>` : 
        (city.fact || "אין מידע זמין.");

    document.getElementById('city-fact').innerHTML = factsHTML;
    document.getElementById('selfie-doll-img').src = dollPhotoURL;
    document.getElementById('city-name').innerText = city.name;
    document.getElementById('travel-report').style.display = 'flex';

    if (photos.length > 1) {
        slideInterval = setInterval(() => {
            currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
            document.getElementById('city-bg').src = photos[currentPhotoIndex];
        }, 3000);
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
    alert("הבחירה נשמרה! תודה שהשתתפת בפרויקט בובות מקומיות.");
    closeConfirmDialog();
    closeTravel();
}
