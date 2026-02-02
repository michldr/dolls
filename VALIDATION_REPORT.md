# Map Validation Report

## ✅ 1. Zoom Coordinates & Map Height - FIXED
All cities and regions now have correct zoom coordinates in script.js. Updated mapCoords object includes all 32 locations:
- Major cities: ירושלים, תל אביב, חיפה, באר שבע, אילת
- Northern cities: צפת, טבריה, נהריה, עכו
- Central cities: נתניה, כפר סבא, רעננה, הרצליה, חדרה, פתח תקווה
- Tel Aviv metro: רמת גן, גבעתיים, בני ברק, חולון, בת ים
- Southern cities: ראשון לציון, נס ציונה, רחובות, מודיעין, אשדוד, אשקלון
- Geographic regions: רמת הגולן, ים המלח, הגליל, הערבה, עוטף עזה, עמק יזרעאל

**CRITICAL FIX**: Updated SVG map heights to match display map:
- Desktop: 70vh → 92vh
- Tablet: 65vh → 88vh
- Mobile: 60vh → 85vh
This ensures coordinates align correctly between interactive map (index.html) and display map (map.html)

## ✅ 2. City Coordinates - FIXED
Updated all cities in cities.js with correct coordinates matching map.html:
- ירושלים: 52.2, 44.7
- תל אביב: 44.0, 38.3
- חיפה: 48.1, 23.2
- באר שבע: 44.1, 55.9
- נהריה: 49.5, 18.0 (fixed from old coordinates)
- All 25+ cities and 6 regions now have accurate coordinates

## 📋 3. City Labels on Map - TODO
Need to add small text labels showing city names on the neon map.
This requires adding a layer with city name markers.

## 📋 4. Image Verification - NEEDS CHECK
All cities have image paths defined in cities.js:
- Jerusalem: 3 images (Jerusalem001.png, Jerusalem002.png, Jerusalem003.png)
- Most cities: 1 image each (cityname.png)
- Images should be in /img/ folder

## ⚠️ Missing Cities in Dropdown
The following cities from map.html coordinates are NOT in cities.js dropdown:
- קרית שמונה, עפולה, כרמיאל, קריות
- הרצליה, חדרה, כפר סבא
- רמת גן, גבעתיים, בני ברק, בת ים
- בית שמש, שדרות, נתיבות, אופקים
- ערד, דימונה, מצפה רמון

These can only receive dolls via direct upload, not through the interactive map selection.
