const missionControl = {
    "kiryat_shmona": { name: "קריית שמונה", fact: "העיר הצפונית ביותר בישראל, מוקפת בטבע מדהים.", photo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000", x: 55, y: 5 },
    "tiberias": { name: "טבריה", fact: "שוכנת על שפת הכנרת, אחת מערי הקודש העתיקות.", photo: "https://images.unsplash.com/photo-1596431940176-788059086591?q=80&w=1000", x: 58, y: 14 },
    "haifa": { name: "חיפה", fact: "עיר נמל יפהפייה הידועה בגנים הבהאיים ובדו-קיום.", photo: "https://images.unsplash.com/photo-1582211516742-998845014674?q=80&w=1000", x: 42, y: 13 },
    "nazareth": { name: "נצרת", fact: "עיר בגליל עם היסטוריה עשירה ושווקים צבעוניים.", photo: "https://images.unsplash.com/photo-1616053733224-b514df8974a6?q=80&w=1000", x: 52, y: 22 },
    "tel_aviv": { name: "תל אביב", fact: "העיר ללא הפסקה! ידועה בחופים ובחדשנות שלה.", photo: "https://images.unsplash.com/photo-1544910903-8d0034606764?q=80&w=1000", x: 30, y: 30 },
    "rishon": { name: "ראשון לציון", fact: "העיר בה הונף לראשונה דגל ישראל והוקם היקב הראשון.", photo: "https://images.unsplash.com/photo-1610450949065-2f9d50a27302?q=80&w=1000", x: 29, y: 34 },
    "jerusalem": { 
        name: "ירושלים", 
        fact: "ירושלים היא בירת ישראל, עיר עם היסטוריה של אלפי שנים המקודשת לדתות רבות.", 
        photo: "https://ynet-pic1.yit.co.il/picserver5/crop_images/2022/05/29/r1GD49NW00c/r1GD49NW00c_0_223_3000_1451_0_x-large.jpg", 
        x: 50, y: 39 
    },
    "beersheba": { name: "באר שבע", fact: "בירת הנגב, עיר של אקדמיה, הייטק והיסטוריה עתיקה.", photo: "https://images.unsplash.com/photo-1560155016-bd4879ae8f21?q=80&w=1000", x: 42, y: 60 },
    "mitzp_ramon": { name: "מצפה רמון", fact: "כאן נמצא מכתש רמון, המכתש הגדול מסוגו בעולם.", photo: "https://images.unsplash.com/photo-1565551225574-061730623250?q=80&w=1000", x: 40, y: 75 },
    "eilat": { name: "אילת", fact: "עיר הנופש הדרומית, שער לים סוף ולשוניות האלמוגים.", photo: "https://images.unsplash.com/photo-1517400508447-f8dd518b86db?q=80&w=1000", x: 41, y: 96 }
};

// Auto-initialize markers and dropdown
const markersLayer = document.getElementById('markers-layer');
const select = document.getElementById('destination');

Object.keys(missionControl).forEach(key => {
    const city = missionControl[key];
    
    // Create Map Marker
    const dot = document.createElement('div');
    dot.className = 'city-dot';
    dot.style.left = city.x + '%';
    dot.style.top = city.y + '%';
    markersLayer.appendChild(dot);

    // Add Dropdown Option
    const opt = document.createElement('option');
    opt.value = key;
    opt.innerText = city.name;
    select.appendChild(opt);
});

function playRetroBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(600, audioCtx.currentTime); 
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch(e) { console.log("Audio not supported"); }
}

function startMission(key) {
    if (!key) return;
    playRetroBeep();
    const target = missionControl[key];
    const doll = document.getElementById('doll');
    const zoomContainer = document.getElementById('map-zoom-container');

    doll.style.left = target.x + '%';
    doll.style.top = target.y + '%';

    setTimeout(() => {
        const zX = (50 - target.x) * 4.5;
        const zY = (40 - target.y) * 4.5;
        zoomContainer.style.transform = `scale(5) translate(${zX}%, ${zY}%)`;

        setTimeout(() => {
            const flash = document.getElementById('flash');
            flash.style.opacity = '0.8';
            setTimeout(() => {
                flash.style.opacity = '0';
                document.getElementById('city-img').src = target.photo;
                document.getElementById('city-title').innerText = target.name;
                document.getElementById('city-fact').innerText = target.fact;
                
                document.getElementById('main-actions').style.display = 'block';
                document.getElementById('sure-prompt').style.display = 'none';
                document.getElementById('final-thanks').style.display = 'none';
                document.getElementById('mission-report').style.display = 'flex';
            }, 100);
        }, 1600);
    }, 1000);
}

function showSurePrompt() {
    document.getElementById('main-actions').style.display = 'none';
    document.getElementById('sure-prompt').style.display = 'block';
}

function confirmFinal() {
    playRetroBeep(); 
    document.getElementById('sure-prompt').style.display = 'none';
    document.getElementById('final-thanks').style.display = 'block';
    setTimeout(backToMap, 2000);
}

function backToMap() {
    document.getElementById('mission-report').style.display = 'none';
    document.getElementById('map-zoom-container').style.transform = 'scale(1) translate(0,0)';
    document.getElementById('destination').value = "";
}