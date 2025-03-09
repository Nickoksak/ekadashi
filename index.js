const SunCalc = require('suncalc');

function getLunarDayStart(date, latitude, longitude) {
    let moonTimes = SunCalc.getMoonTimes(date, latitude, longitude, true);
    return moonTimes.rise || null; // Return the moonrise time
}

function getMoonPhases(year, month) {
    const synodicMonth = 29.530588861; // Exact duration of a lunar month
    const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)); // Known new moon (NASA)

    function getNextPhase(baseDate, offsetDays) {
        return new Date(baseDate.getTime() + offsetDays * 86400000);
    }

    let today = new Date(year, month - 1, 1);
    let daysSinceKnownNewMoon = (today - knownNewMoon) / 86400000;
    let cyclesSince = daysSinceKnownNewMoon / synodicMonth;
    let nextNewMoonCycle = Math.ceil(cyclesSince);

    let nextNewMoon = getNextPhase(knownNewMoon, nextNewMoonCycle * synodicMonth);
    let nextFullMoon = getNextPhase(nextNewMoon, synodicMonth / 2);

    return {
        newMoon: nextNewMoon.toUTCString(),
        fullMoon: nextFullMoon.toUTCString()
    };
}

let latitude = 42.50779;
let longitude = 1.52109;

let today = new Date();
today.setDate(today.getDate() - 30);
let moonPhases = getMoonPhases(today.getFullYear(), today.getMonth() + 1);

console.log("🌑 New Moon:", moonPhases.newMoon);

let eleventhLunarDay = new Date(moonPhases.newMoon);
eleventhLunarDay.setDate(eleventhLunarDay.getDate() + 10);

let lunarDayStart = getLunarDayStart(eleventhLunarDay, latitude, longitude);
console.log("Start of the 11th lunar day from the new moon:", lunarDayStart);

console.log("🌕 Full Moon:", moonPhases.fullMoon);

eleventhLunarDay = new Date(moonPhases.fullMoon);
eleventhLunarDay.setDate(eleventhLunarDay.getDate() + 10);

lunarDayStart = getLunarDayStart(eleventhLunarDay, latitude, longitude);
console.log("Start of the 11th lunar day from the full moon:", lunarDayStart);
