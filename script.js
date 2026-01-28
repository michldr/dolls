let userName = "";
let dollPhotoURL = "";
let currentPhotoIndex = 0;
let currentCityKey = "";
let slideInterval; // Variable to control the automatic slideshow timer

// --- 1. GREEN SCREEN LOGIC (Offline & Fast) ---

// Handle File Input
document.getElementById('doll-photo-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const statusText = document.getElementById('file-status');
    statusText.innerText = "סטטוס: מעבד צבע ירוק...";
    statusText.style.color = "var(--neon-cyan)";
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Process the image instantly using Chroma Key
            dollPhotoURL = removeGreenBackground(img);
            
            statusText.innerText = "סטטוס: הרקע הירוק הוסר בהצלחה!";
            statusText.style.color = "#00ff00";
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// The Magic Function: Removes Green Pixels
function removeGreenBackground(imageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to image size
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    
    // Draw original image
    ctx.drawImage(imageElement, 0, 0);
    
    // Get raw pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data; // Array of [R, G, B, A...]

    // Loop through every pixel
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];     // Red
        const g = data[i + 1]; // Green
        const b = data[i + 2]; // Blue

        // Logic: Is this pixel mostly GREEN?
        // Adjust '1.4' if it removes too much or too little
        if (g > 100 && g > r * 1.4 && g > b * 1.4) {
            data[i + 3] = 0; // Set Alpha to 0 (Transparent)
        }
    }
    
    // Put modified pixels back
    ctx.putImageData(imageData, 0, 0);
    
    // Return the new Data URL
    return canvas.toDataURL();
}

// --- 2. INITIALIZATION (Login & Map Setup) ---

function initializePortal() {
    const name = document.getElementById('user-name').value;
    
    if (!name) {
        alert("נא להזין שם");
        return;
    }
    
    if (!dollPhotoURL) {
        alert("נא להעלות תמונה של הבובה (המתן להודעה ירוקה)");
        return;
    }
    
    userName = name;
    
    // Hide Sync Screen, Show Main Interface
    document.getElementById('sync-screen').style.display = 'none';
    document.getElementById('main-interface').style.display = 'block';
    document.getElementById('welcome-message').innerText = `שלום ${userName}, באיזו עיר אתה גר?`;
    
    // Set the synced doll on the map
    document.getElementById('map-doll-img').src = dollPhotoURL;
    document.getElementById('map-doll-img').style.display = 'block';
    
    // Populate Map Markers & Dropdown from cities.js
    const markersLayer = document.getElementById('markers-layer');
    const select = document.getElementById('destination');
    
    Object.keys(missionControl).forEach(key => {
        const city = missionControl[key];
        
        // Add Dot to Map
        const dot = document.createElement('div');
        dot.className = 'city-dot';
        dot.style.left = city.x + '%';
        dot.style.top = city.y + '%';
        markersLayer.appendChild(dot);
        
        // Add Option to Dropdown
        const opt = document.createElement('option');
        opt.value = key;
        opt.innerText = city.name;
        select.appendChild(opt);
    });
}

// --- 3. TRAVEL LOGIC (Movement & Zoom) ---

function startTravel(key) {
    if (!key) return;
    currentCityKey = key; 
    const target = missionControl[key];
    const dollContainer = document.getElementById('doll-container');
    const zoomContainer = document.getElementById('map-zoom-container');

    // Move Doll
    dollContainer.style.left = target.x + '%';
    dollContainer.style.top = target.y + '%';

    setTimeout(() => {
        // Zoom Effect
        const zX = (50 - target.x) * 4.5;
        const zY = (40 - target.y) * 4.5;
        zoomContainer.style.transform = `scale(5) translate(${zX}%, ${zY}%)`;

        setTimeout(() => {
            // Flash Effect
            document.getElementById('flash').style.opacity = '1';
            setTimeout(() => {
                document.getElementById('flash').style.opacity = '0';
                showTravelSelfie(key);
            }, 100);
        }, 1600);
    }, 1000);
}

// --- 4. SELFIE & SLIDESHOW LOGIC ---

function showTravelSelfie(key) {
    const city = missionControl[key];
    
    // 1. Clear any running timer from previous visits
    clearInterval(slideInterval);

    // 2. Prepare Photos Array (Support both old string & new array format)
    let photos = [];
    if (city.photos && Array.isArray(city.photos)) {
        photos = city.photos;
    } else if (city.photo) {
        photos = [city.photo];
    } else {
        photos = [""]; // Fallback if no photo
    }
    
    // 3. Show First Photo
    currentPhotoIndex = 0;
    document.getElementById('city-bg').src = photos[0];

    // 4. Prepare Facts List
    let factsHTML = "";
    if (city.facts && Array.isArray(city.facts)) {
        factsHTML = "<ul>" + city.facts.map(f => `<li style='margin-bottom:10px;'>${f}</li>`).join('') + "</ul>";
    } else if (city.fact) {
        factsHTML = city.fact;
    } else {
        factsHTML = "אין מידע זמין.";
    }
    document.getElementById('city-fact').innerHTML = factsHTML;
    
    // 5. Update Doll & Title
    document.getElementById('selfie-doll-img').src = dollPhotoURL;
    document.getElementById('city-name').innerText = city.name;
    
    // 6. Show Modal
    document.getElementById('travel-report').style.display = 'flex';

    // 7. Start Automatic Slideshow (if more than 1 photo)
    if (photos.length > 1) {
        slideInterval = setInterval(() => {
            currentPhotoIndex++;
            
            // Loop back to start
            if (currentPhotoIndex >= photos.length) {
                currentPhotoIndex = 0;
            }
            
            // Switch Image
            document.getElementById('city-bg').src = photos[currentPhotoIndex];
            
        }, 2000); // 2000ms = 2 seconds
    }
}

function closeTravel() {
    // Stop the slideshow to save performance
    clearInterval(slideInterval);
    
    document.getElementById('travel-report').style.display = 'none';
    document.getElementById('map-zoom-container').style.transform = 'scale(1) translate(0,0)';
    document.getElementById('destination').value = "";
}

// --- NEW BUTTON LOGIC ---

function confirmCitySelection() {
    // 1. Check if a city is currently selected
    if (!currentCityKey) return;

    // 2. Get the city name
    const cityName = missionControl[currentCityKey].name;

    // 3. Show a message (You can change this message!)
    alert("איזה יופי! בחרת ב-" + cityName + ". בואו נתחיל!");

    // 4. Close the window
    closeTravel();
}
