function getLocalTime(t, date = new Date(), zone = 'America/New_York') {
    const formatter = new Intl.DateTimeFormat('en-US', {
        //timeZone: zone,
        [t]: 'numeric',
        hour12: false
    });
    if (t === 'year') {
        return formatter.format(date)
    } else if (t === 'hour') {
        const h = formatter.format(date).padStart(2, '0')
        if (h === '24') {
            return '00'
        } else {
            return h
        }
    }
    else {
        return formatter.format(date).padStart(2, '0')
    }
}

function getLocalTimeObj(date = new Date(), zone = 'America/New_York') {
    let res = {}
    let ts = ['year', 'month', 'day', 'hour', 'minute', 'second']
    ts.forEach(t => {
        res[t] = getLocalTime(t, date, zone)
    })
    return res
}

const timeDiff = (a, b) => {
    const at = new Date(a).getTime();
    const bt = new Date(b).getTime();
    const diff = (bt - at) / 1000 / 60; // minutes
    return diff;
}

const timeObjFormatter = (timeObj) => {
    // like '2023-08-17 23:10:56'
    return timeObj.year + '-' + timeObj.month + '-' + timeObj.day + ' ' + timeObj.hour + ':' + timeObj.minute + ':' + timeObj.second;
}

const getMidTime = (a, b) => {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const at = new Date(a).getTime();
    const bt = new Date(b).getTime();
    const mt = (at + bt) / 2;
    const m = new Date(mt);
    const midTimeObj = getLocalTimeObj(date = m)
    const midDateString = timeObjFormatter(midTimeObj);
    return midDateString;
}

const getRange = (days) => {
    const now = new Date();
    const ago = now.getTime() - 24 * 60 * 60 * 1000 * days;
    const range0 = timeObjFormatter(getLocalTimeObj(date = ago));
    const range1 = timeObjFormatter(getLocalTimeObj(date = now));
    return [range0, range1];
}

const getDayLine = () => {
    const now = new Date();
    const nowObj = getLocalTimeObj(date = now);
    const dayLine = nowObj.year + '-' + nowObj.month + '-' + nowObj.day + ' 00:00:00';
    const dayLine2 = nowObj.year + '-' + nowObj.month + '-' + nowObj.day + ' 00:00:01';
    return [{ x: dayLine, y: 0 }, { x: dayLine2, y: 100 }];
}

const getDates = (days = 30) => {
    const dates = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dates.push(timeObjFormatter(getLocalTimeObj(date)).split(' ')[0]);
    }
    return dates;
}


const timeShift = (time, shiftDays) => {
    const t = new Date(time);
    const t2 = t.getTime() + 24 * 60 * 60 * 1000 * shiftDays;
    return timeObjFormatter(getLocalTimeObj(date = t2));
}

const getDayLines = () => {
    // get day lines for 7 days
    const now = new Date();
    const nowObj = getLocalTimeObj(date = now);
    const dayLines = [];
    const dayLine = nowObj.year + '-' + nowObj.month + '-' + nowObj.day + ' 00:00:00';
    const dayLine2 = nowObj.year + '-' + nowObj.month + '-' + nowObj.day + ' 00:00:01';
    dayLines.push([{ x: dayLine, y: 0 }, { x: dayLine2, y: 100 }]);
    for (let i = 1; i < 7; i++) {
        const dayLine_ = timeShift(dayLine, -i);
        const dayLine2_ = timeShift(dayLine2, -i);
        dayLines.push([{ x: dayLine_, y: 0 }, { x: dayLine2_, y: 100 }]);
    }
    return dayLines;
}

const getDaysRange = (data) => {
    const dateRange = {}; // {'2023-07-29': [0,18], '2023-07-30': [19, 37], ...}
    let lastDate = 'none';
    for (let i = 0; i < data.length; i++) {
        const date = data[i].date.split(' ')[0];
        if (date !== lastDate) {
            dateRange[date] = [i, i];
            lastDate = date;
        } else {
            dateRange[date][1] = i;
        }
    }
    return dateRange;
}

module.exports = {
    getLocalTime,
    getLocalTimeObj,
    timeDiff,
    timeObjFormatter,
    getMidTime,
    getRange,
    getDayLine,
    getDayLines,
    getDates,
    getDaysRange,
}