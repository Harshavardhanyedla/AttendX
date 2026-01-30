function getCurrentDay(date = new Date()) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function getCurrentPeriod(date = new Date()) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = hour * 60 + minute; // Minutes from midnight

    // P1: 09:00 (540) – 10:00 (600)
    if (time >= 540 && time < 600) return 1;

    // P2: 10:00 (600) – 11:00 (660)
    if (time >= 600 && time < 660) return 2;

    // P3: 11:10 (670) – 12:05 (725)
    if (time >= 670 && time < 725) return 3;

    // P4: 12:05 (725) – 13:00 (780)
    if (time >= 725 && time < 780) return 4;

    // BREAK: 13:00 (780) – 14:00 (840)
    if (time >= 780 && time < 840) return 'BREAK';

    // P5: 14:00 (840) – 15:00 (900)
    if (time >= 840 && time < 900) return 5;

    // P6: 15:00 (900) – 16:00 (960)
    if (time >= 900 && time < 960) return 6;

    // P7: 16:00 (960) – 17:00 (1020)
    if (time >= 960 && time < 1020) return 7;

    return null; // Before college or after college
}

function getPeriodTimeRange(period) {
    const ranges = {
        1: '09:00 - 10:00',
        2: '10:00 - 11:00',
        3: '11:10 - 12:05',
        4: '12:05 - 13:00',
        5: '14:00 - 15:00',
        6: '15:00 - 16:00',
        7: '16:00 - 17:00'
    };
    return ranges[period] || '';
}

module.exports = { getCurrentDay, getCurrentPeriod, getPeriodTimeRange };
