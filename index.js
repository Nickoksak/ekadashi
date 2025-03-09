const SunCalc = require('suncalc');

const latitude = 42.50779;
const longitude = 1.52109;
let moonStates = [];

function getLunarDayStart(date, latitude, longitude) {
    let moonTimes = SunCalc.getMoonTimes(date, latitude, longitude, true);
    return moonTimes.rise || null; // Return the moonrise time
}

/**
 * Calculate Julian Day Number from date
 */
function dateToJulian(date) {
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  let d = date.getUTCDate() + 
          (date.getUTCHours() - 12) / 24 + 
          date.getUTCMinutes() / 1440 + 
          date.getUTCSeconds() / 86400;
  
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

/**
 * Convert Julian Day to date
 */
function julianToDate(jd) {
  jd += 0.5;
  const z = Math.floor(jd);
  const f = jd - z;
  
  let a;
  if (z < 2299161) {
    a = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  
  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  
  // Extract time
  const dayInt = Math.floor(day);
  const frac = day - dayInt;
  const hours = Math.floor(frac * 24);
  const minutes = Math.floor((frac * 24 - hours) * 60);
  const seconds = Math.floor(((frac * 24 - hours) * 60 - minutes) * 60);
  
  return new Date(Date.UTC(year, month - 1, dayInt, hours, minutes, seconds));
}

/**
 * Calculate the phase of the Moon based on lunation number
 * k = 0 is the new moon of 2000 January 6
 * phase: 0 = new moon, 0.5 = full moon
 */
function getMoonPhaseJD(k, phase = 0) {
  // Adjust k for the desired phase
  k = Math.floor(k) + phase;
  
  // Time in Julian centuries since J2000.0
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  
  // Mean phase of the moon
  let JDE = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
  
  // Mean anomaly of the sun
  let M = 2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3;
  
  // Mean anomaly of the moon
  let M1 = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
  
  // Moon's argument of latitude
  let F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
  
  // Longitude of the ascending node of the lunar orbit
  let Omega = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;
  
  // Convert to radians
  const Mrad = normalize(M) * Math.PI / 180;
  const M1rad = normalize(M1) * Math.PI / 180;
  const Frad = normalize(F) * Math.PI / 180;
  const Omegarad = normalize(Omega) * Math.PI / 180;
  
  // Correction terms for new moon
  if (phase < 0.01 || Math.abs(phase - 1) < 0.01) {  // New Moon
    JDE += -0.40720 * Math.sin(M1rad);
    JDE += 0.17241 * Math.sin(Mrad);
    JDE += 0.01608 * Math.sin(2 * M1rad);
    JDE += 0.01039 * Math.sin(2 * Frad);
    JDE += 0.00739 * Math.sin(M1rad - Mrad);
    JDE += -0.00514 * Math.sin(M1rad + Mrad);
    JDE += 0.00208 * Math.sin(2 * Mrad);
    JDE += -0.00111 * Math.sin(M1rad - 2 * Frad);
    JDE += -0.00057 * Math.sin(M1rad + 2 * Frad);
    JDE += 0.00056 * Math.sin(2 * M1rad + Mrad);
    JDE += -0.00042 * Math.sin(3 * M1rad);
    JDE += 0.00042 * Math.sin(Mrad + 2 * Frad);
    JDE += 0.00038 * Math.sin(Mrad - 2 * Frad);
    JDE += -0.00024 * Math.sin(2 * M1rad - Mrad);
    JDE += -0.00017 * Math.sin(Omegarad);
    JDE += -0.00007 * Math.sin(M1rad + 2 * Mrad);
    JDE += 0.00004 * Math.sin(2 * M1rad - 2 * Frad);
    JDE += 0.00004 * Math.sin(3 * Mrad);
    JDE += 0.00003 * Math.sin(M1rad + Mrad - 2 * Frad);
    JDE += 0.00003 * Math.sin(2 * M1rad + 2 * Frad);
    JDE += -0.00003 * Math.sin(M1rad + Mrad + 2 * Frad);
    JDE += 0.00003 * Math.sin(M1rad - Mrad + 2 * Frad);
    JDE += -0.00002 * Math.sin(M1rad - Mrad - 2 * Frad);
    JDE += -0.00002 * Math.sin(3 * M1rad + Mrad);
    JDE += 0.00002 * Math.sin(4 * M1rad);
  } 
  else if (Math.abs(phase - 0.5) < 0.01) {  // Full Moon
    JDE += -0.40614 * Math.sin(M1rad);
    JDE += 0.17302 * Math.sin(Mrad);
    JDE += 0.01614 * Math.sin(2 * M1rad);
    JDE += 0.01043 * Math.sin(2 * Frad);
    JDE += 0.00734 * Math.sin(M1rad - Mrad);
    JDE += -0.00515 * Math.sin(M1rad + Mrad);
    JDE += 0.00209 * Math.sin(2 * Mrad);
    JDE += -0.00111 * Math.sin(M1rad - 2 * Frad);
    JDE += -0.00057 * Math.sin(M1rad + 2 * Frad);
    JDE += 0.00056 * Math.sin(2 * M1rad + Mrad);
    JDE += -0.00042 * Math.sin(3 * M1rad);
    JDE += 0.00042 * Math.sin(Mrad + 2 * Frad);
    JDE += 0.00038 * Math.sin(Mrad - 2 * Frad);
    JDE += -0.00024 * Math.sin(2 * M1rad - Mrad);
    JDE += -0.00017 * Math.sin(Omegarad);
    JDE += -0.00007 * Math.sin(M1rad + 2 * Mrad);
    JDE += 0.00004 * Math.sin(2 * M1rad - 2 * Frad);
    JDE += 0.00004 * Math.sin(3 * Mrad);
    JDE += 0.00003 * Math.sin(M1rad + Mrad - 2 * Frad);
    JDE += 0.00003 * Math.sin(2 * M1rad + 2 * Frad);
    JDE += -0.00003 * Math.sin(M1rad + Mrad + 2 * Frad);
    JDE += 0.00003 * Math.sin(M1rad - Mrad + 2 * Frad);
    JDE += -0.00002 * Math.sin(M1rad - Mrad - 2 * Frad);
    JDE += -0.00002 * Math.sin(3 * M1rad + Mrad);
    JDE += 0.00002 * Math.sin(4 * M1rad);
  }
  
  return JDE;
}

/**
 * Normalize an angle to the range [0, 360)
 */
function normalize(angle) {
  angle = angle % 360;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

/**
 * Calculate the next new moon after a given date
 */
function getNextNewMoon(date) {
  const jd = dateToJulian(date);
  
  // Approximate k value for date
  // k = 0 is the new moon of 2000 January 6
  let k = Math.floor((date.getUTCFullYear() + (date.getUTCMonth() + 1) / 12 - 2000) * 12.3685);
  
  // Search forward to find the next new moon
  for (let i = 0; i < 5; i++) {  // Try a few k values to find the next one
    const newMoonJD = getMoonPhaseJD(k + i, 0);
    if (newMoonJD > jd) {
      return julianToDate(newMoonJD);
    }
  }
  
  // Fallback (should not happen with reasonable dates)
  return julianToDate(getMoonPhaseJD(k + 1, 0));
}

/**
 * Calculate the next full moon after a given date
 */
function getNextFullMoon(date) {
  const jd = dateToJulian(date);
  
  // Approximate k value for date
  let k = Math.floor((date.getUTCFullYear() + (date.getUTCMonth() + 1) / 12 - 2000) * 12.3685);
  
  // Search forward to find the next full moon
  for (let i = 0; i < 5; i++) {  // Try a few k values to find the next one
    const fullMoonJD = getMoonPhaseJD(k + i, 0.5);
    if (fullMoonJD > jd) {
      return julianToDate(fullMoonJD);
    }
  }
  
  // Fallback (should not happen with reasonable dates)
  return julianToDate(getMoonPhaseJD(k + 1, 0.5));
}

/**
 * Calculate the 11th lunar day after a moon phase
 */
function getEleventhLunarDay(moonPhaseDate) {
  // 11th lunar day is simply 10 days after the phase
  const eleventhDay = new Date(moonPhaseDate.getTime() + 10 * 24 * 60 * 60 * 1000);
  
  // Adjust for longitude (approximate adjustment)
  const longitudeOffsetHours = longitude / 15; // 15 degrees = 1 hour
  return new Date(eleventhDay.getTime() + longitudeOffsetHours * 60 * 60 * 1000);
}

/**
 * Format the times in a readable UTC format
 */
function formatUTCDate(date) {
  return date.getUTCFullYear() + '-' + 
         padZero(date.getUTCMonth() + 1) + '-' + 
         padZero(date.getUTCDate()) + ' ' + 
         padZero(date.getUTCHours()) + ':' + 
         padZero(date.getUTCMinutes()) + ':' + 
         padZero(date.getUTCSeconds()) + ' UTC';
}

function padZero(num) {
  return num.toString().padStart(2, '0');
}

/**
 * Verify the accuracy of our calculations against known values
 */
function verifyAccuracy() {
  const knownPhases = [
    { type: "new", date: new Date('2025-01-29T16:37:00Z') },
    { type: "new", date: new Date('2025-02-28T00:46:00Z') },
    { type: "new", date: new Date('2025-03-29T10:58:00Z') },
    { type: "full", date: new Date('2025-01-15T03:55:00Z') },
    { type: "full", date: new Date('2025-02-13T13:53:00Z') },
    { type: "full", date: new Date('2025-03-14T06:55:00Z') }
  ];
  
  console.log("Verifying calculation accuracy:");
  
  for (const known of knownPhases) {
    // Calculate from 20 days before
    const testDate = new Date(known.date.getTime() - 20 * 24 * 60 * 60 * 1000);
    const calculatedDate = known.type === "new" ? 
      getNextNewMoon(testDate) : 
      getNextFullMoon(testDate);
    
    // Calculate difference in minutes
    const diffMs = Math.abs(calculatedDate - known.date);
    const diffMinutes = diffMs / (1000 * 60);
    
    console.log(`${known.type.charAt(0).toUpperCase() + known.type.slice(1)} Moon (${formatUTCDate(known.date)}):`);
    console.log(`  Calculated: ${formatUTCDate(calculatedDate)}`);
    console.log(`  Difference: ${diffMinutes.toFixed(1)} minutes`);
  }
  console.log("");
}

// Display method information
console.log(`Moon Phase Calculator (Jean Meeus Algorithm)`);
console.log(`Location: Latitude ${latitude}°, Longitude ${longitude}°`);

// Verify calculation accuracy
verifyAccuracy();

// Display all new and full moons for the year 2025
console.log("\n--- ALL MOON PHASES FOR 2025 ---");

// Start from December 2024 to catch the first new/full moon of 2025
let currentDate = new Date('2024-12-15T00:00:00Z');
const endOfYear = new Date('2025-12-31T23:59:59Z');

console.log("\nNEW MOONS 2025:");
let count = 1;
const newMoons = [];

while (currentDate < endOfYear) {
  const nextNewMoon = getNextNewMoon(currentDate);
  
  // Only include moons in 2025
  if (nextNewMoon.getUTCFullYear() === 2025) {
    console.log(`${count}. ${formatUTCDate(nextNewMoon)}`);
    newMoons.push(nextNewMoon);
    moonStates.push(nextNewMoon)
    count++;
  }
  
  // Move just past this new moon to find the next one
  currentDate = new Date(nextNewMoon.getTime() + 24 * 60 * 60 * 1000);
  
  // Safety check to prevent infinite loops
  if (count > 15) break;
}

// Reset to find full moons
currentDate = new Date('2024-12-15T00:00:00Z');
console.log("\nFULL MOONS 2025:");
count = 1;
const fullMoons = [];

while (currentDate < endOfYear) {
  const nextFullMoon = getNextFullMoon(currentDate);
  
  // Only include moons in 2025
  if (nextFullMoon.getUTCFullYear() === 2025) {
    console.log(`${count}. ${formatUTCDate(nextFullMoon)}`);
    fullMoons.push(nextFullMoon);
    moonStates.push(nextFullMoon)
    count++;
  }
  
  // Move just past this full moon to find the next one
  currentDate = new Date(nextFullMoon.getTime() + 24 * 60 * 60 * 1000);
  
  // Safety check to prevent infinite loops
  if (count > 15) break;
}


console.log("\nEkadashis 2025:");

moonStates.sort((a, b) => a-b);

moonStates.forEach((moonState) => {
    let ekadashi = getEleventhLunarDay(moonState);
    let ekadashiStart = getLunarDayStart(ekadashi, latitude, longitude);
    if (ekadashiStart) console.log(ekadashiStart)
    else {
            ekadashi.setDate(ekadashi.getDate() + 1);
            ekadashiStart = getLunarDayStart(ekadashi, latitude, longitude);
            console.log(ekadashiStart)
    }
});
