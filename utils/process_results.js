const { timeDiff, getRange, getDayLines, getLocalTimeObj, timeObjFormatter, getMidTime, getDates, getDaysRange } = require("./time.js");

const segmentMinNumber = 6;
const interval = 3; // minutes


const isNeighbor = (a, b) => {
    const diff = timeDiff(a, b);
    return diff < interval * 1.5;
}

const ignoring = (results) => {
    if (results.length < 2) {
        return [];
    }
    const resultsFiltered = [results[0]];
    for (let i = 1; i < results.length; i++) {
        dischargingNeighbor = results[i].charging === "0" && results[i - 1].charging === "0" && isNeighbor(results[i - 1].date, results[i].date)
        samePercentage = results[i].percentage === results[i - 1].percentage
        // filter out points with same percentage and discharging neighbor
        if (!(dischargingNeighbor && samePercentage) || (i === results.length - 1)) {
            resultsFiltered.push(results[i]);
        }
    }
    return resultsFiltered;
}

const getChargingSegments = (results) => {
    if (results.length < 2) {
        return [];
    }
    const segments = [];
    let currentSegment = [];
    for (let i = 0; i < results.length; i++) {
        if (results[i].charging === "1" || results[i].charging === "2") {
            currentSegment.push(i);
        } else {
            if (currentSegment.length > 1) {
                segments.push([currentSegment[0], currentSegment[currentSegment.length - 1]]);
            }
            currentSegment = [];
        }
    }
    if (currentSegment.length > 1) {
        segments.push([currentSegment[0], currentSegment[currentSegment.length - 1]]);
    }

    const finalData = flatten(segments, results);
    // if y is not null then change it to 1
    for (let i = 0; i < finalData.length; i++) {
        if (finalData[i].y !== null) {
            finalData[i].y = 1;
        }
    }
    return finalData;
}


const flatten = (segments, results) => {
    const resultsFlattened = [];
    for (let i = 0; i < segments.length; i++) {
        for (let j = 0; j < segments[i].length; j++) {
            if (results === undefined) {
                resultsFlattened.push({ x: segments[i][j].x, y: segments[i][j].y });
            } else {
                resultsFlattened.push({ x: results[segments[i][j]].date, y: results[segments[i][j]].percentage });
            }
        }
        if (i < segments.length - 1) {
            if (results === undefined) {
                resultsFlattened.push({
                    x: getMidTime(segments[i][segments[i].length - 1].x, segments[i + 1][0].x),
                    y: null
                });
            } else {
                resultsFlattened.push({
                    x: getMidTime(results[segments[i][segments[i].length - 1]].date, results[segments[i + 1][0]].date),
                    y: null
                });
            }
        }
    }
    return resultsFlattened;
}



const filterSegments = (results, segments) => {
    const segmentsFiltered = [];
    for (let i = 0; i < segments.length; i++) {
        // call the ignoring function to filter each segment
        const segmentFiltered = ignoring(results.slice(segments[i][0], segments[i][segments[i].length - 1] + 1));
        if (segmentFiltered.length > 1) {
            segmentsFiltered.push(segmentFiltered);
        }
    }
    return segmentsFiltered;
}

const getDischargingSegments = (results) => {
    const segments = [];
    let currentSegment = [];

    for (let i = 1; i < results.length; i++) {
        if (results[i].charging === "0" && results[i - 1].charging === "0" && isNeighbor(results[i - 1].date, results[i].date)) {
            currentSegment.push(i);
        } else {
            if (currentSegment.length >= segmentMinNumber - 1) {
                segments.push([currentSegment[0] - 1, ...currentSegment]);
            }
            currentSegment = [];
        }
    }
    if (currentSegment.length >= segmentMinNumber - 1) {
        segments.push([currentSegment[0] - 1, ...currentSegment]);
    }
    return segments;
}



const getSegments = (results, step) => {
    if (results.length < segmentMinNumber) {
        return [];
    }
    const segments = getDischargingSegments(results);
    //console.log(segments);
    const segmentsFiltered = filterSegments(results, segments);
    if (segmentsFiltered.length === 0) {
        return [];
    }
    const segmentsMovingAverage = [];
    for (let i = 0; i < segmentsFiltered.length; i++) {
        const segmentMovingAverage = [];
        let cursor = 0;
        while (cursor + step < segmentsFiltered[i].length) {
            const left = segmentsFiltered[i][cursor];
            const right = segmentsFiltered[i][cursor + step];
            const x = right.date;
            const y = (left.percentage - right.percentage) / timeDiff(left.date, right.date) * 60;
            segmentMovingAverage.push({ x: x, y: y });
            cursor += step;
        }
        // Adjust the last few points because they many not be enough to calculate the moving average
        // we include them in the last moving average point
        if (true) {
            const left = segmentsFiltered[i][Math.max(cursor - step, 0)];
            const right = segmentsFiltered[i][segmentsFiltered[i].length - 1];
            const x = right.date;
            const y = (left.percentage - right.percentage) / timeDiff(left.date, right.date) * 60;
            segmentMovingAverage[Math.max(segmentMovingAverage.length - 1, 0)] = { x: x, y: y };
        }

        // add the start of the segment with same y value of the first point
        if (segmentMovingAverage.length > 0) {
            segmentMovingAverage.unshift({ x: segmentsFiltered[i][0].date, y: segmentMovingAverage[0].y });
        }

        segmentsMovingAverage.push(segmentMovingAverage);
    }
    //console.log('segmentsMovingAverage', segmentsMovingAverage)
    //const finalData = flatten(segmentsMovingAverage);
    return segmentsMovingAverage;
}

const truncateData = (data, days) => {
    const results = [];
    const now = new Date();
    const nowStr = timeObjFormatter(getLocalTimeObj(date = now));
    for (let i = 0; i < data.length; i++) {
        if (timeDiff(data[i].date, now) <= days * 24 * 60) {
            // valid data should have charging=0/1/2 and percentage can be parsed into a number  in [0, 100]   
            if ((data[i].charging === "0" || data[i].charging === "1" || data[i].charging === "2") && !isNaN(parseInt(data[i].percentage))) {
                results.push(data[i]);
            }
        }
    }
    return results;
}

const updateConsumptionData = (results, stepSize) => {
    const consumptionData = getSegments(results, stepSize);
    return consumptionData;
}

const processing = (resultsTruncated, days, stepSize) => {
    const data = {};
    //const resultsTruncated = truncateData(results, 7);
    const resultsFiltered = ignoring(resultsTruncated);
    data.data1 = resultsFiltered.map((row) => {
        return { x: row.date, y: row.percentage };
    });
    data.chargingData = getChargingSegments(resultsTruncated);
    data.consumptionData = getSegments(resultsTruncated, stepSize);
    // range of x axis is now and 24 hours ago
    data.range = getRange(days);
    data.dayLines = flatten(getDayLines());
    //console.log(data.range)
    return data;
}

const processingDays = (data) => {
    // geenrate dates for the last 30 days like ['2023-07-29', '2023-07-30', ...]
    const dates = getDates(30);
    //console.log(dates)
    // group the data by date, find the range of index for each date
    const datesRange = getDaysRange(data); // {'2023-07-29': [0,18], '2023-08-01': [19, 37], ...}
    //console.log(datesRange);
    const workingTime = {};
    const cunsumptionRate = {}
    for (let i = 0; i < dates.length; i++) {
        workingTime[dates[i]] = 0;
        cunsumptionRate[dates[i]] = 0;
    }
    // iterate datesRange, for each date, get the working time
    for (const [key, value] of Object.entries(datesRange)) {
        const dayData = data.slice(value[0], value[1] + 1);
        workingTime[key] = getWorkingTime(dayData);
        cunsumptionRate[key] = getConsumptionRate(dayData);
    }
    const results = { workingTime: [], consumptionRate: [] };
    for (const [key, value] of Object.entries(workingTime)) {
        results.workingTime.push({ x: key, y: value }); // [{x: '2023-07-29', y: 8}, {x: '2023-07-30', y: 0}, ...]
    }
    for (const [key, value] of Object.entries(cunsumptionRate)) {
        results.consumptionRate.push({ x: key, y: value });
    }

    return results;
}

const getWorkingTime = (data) => {
    // if two points are neighbors they belong in a working segment
    if (data.length < 2) {
        return 0;
    }
    const segments = [];
    let currentSegment = [];
    for (let i = 1; i < data.length; i++) {
        if (isNeighbor(data[i - 1].date, data[i].date)) {
            currentSegment.push(i);
        } else {
            if (currentSegment.length > 3) { // at least 4 points (12 min) in a segment
                segments.push([currentSegment[0], currentSegment[currentSegment.length - 1]]);
            }
            currentSegment = [];
        }
    }
    if (currentSegment.length > 3) {
        segments.push([currentSegment[0], currentSegment[currentSegment.length - 1]]);
    }
    // sum up the time of all segments
    let workingTime = 0;
    for (let i = 0; i < segments.length; i++) {
        workingTime += timeDiff(data[segments[i][0]].date, data[segments[i][1]].date);
    }
    return workingTime / 60;
}

const getConsumptionRate = (data) => {
    const segments = getDischargingSegments(data);
    let totalConsumption = 0;
    let totalTime = 0;
    for (let i = 0; i < segments.length; i++) {
        const left = segments[i][0];
        const right = segments[i][segments[i].length - 1];
        totalConsumption += data[left].percentage - data[right].percentage;
        totalTime += timeDiff(data[left].date, data[right].date);
    }
    return totalConsumption / totalTime * 60;
}

module.exports = { processing, truncateData, updateConsumptionData, processingDays };

