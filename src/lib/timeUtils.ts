import {DateTime} from "luxon";

// returns true if A is before B
export function isBefore(a: Date, b: Date): boolean {
    return a.getTime() < b.getTime()
}

export function getNextWAN(now = new Date(), buffer = true, hasDone?: boolean): Date {
    const adjustedNow = now;
    // Adjust 'now' for loose wan for LTX
    if(adjustedNow.getFullYear() == 2023 && adjustedNow.getMonth() == 6 && adjustedNow.getDate() == 29) {
        adjustedNow.setDate(adjustedNow.getDate() - 1);
    }
    let wanDate = getLooseWAN(adjustedNow);

    while(wanDate.weekday !== 5 && !isNaN(wanDate.weekday)) {
        wanDate = wanDate.plus({days: 1});
    }

    if(isNaN(wanDate.weekday)) throw new Error("Bad weekday from " + wanDate.toString() + " while processing " + now)

    let shouldStay: boolean;
    if (buffer) {
        if (typeof hasDone != 'undefined') {
            shouldStay = !hasDone;
            console.log({hasDone, shouldStay})
        } else {
            shouldStay = now.getTime() - wanDate.toJSDate().getTime() > 5 * 60 * 60 * 1e3;
        }
    } else {
        shouldStay = false;
    }


    if(isBefore(wanDate.toJSDate(), now) && !shouldStay) {
        wanDate = wanDate.plus({days: 7});
    }

    // prevent counting down til next wan if current wan hasn't come yet
    if(wanDate.toJSDate().getTime() - now.getTime() > 6 * 24 * 60 * 60e3 && shouldStay) {
        wanDate = wanDate.minus({days: 7})
    }

    // LTX wan is on saturday instead of friday
    if(
      (wanDate.year == 2023 && wanDate.month == 7 && wanDate.day == 28) ||
      (wanDate.year == 2019 && wanDate.month == 7 && wanDate.day == 26)

    ) {
        wanDate = wanDate.plus({days: 1})
    }

    // 7/18/2023 skipped due to production shutdown (from GN callout)
    if(wanDate.year == 2023 && wanDate.month == 8 && wanDate.day == 18) {
        wanDate = wanDate.plus({days: 7});
    }

    return wanDate.toJSDate();
}

export function getPreviousWAN(now = new Date(), luxon = false): Date | DateTime {
    let wanDate = getLooseWAN(now);

    while(wanDate.weekday !== 5) {
        wanDate = wanDate.minus({days: 1});
    }

    if(isBefore(now, wanDate.toJSDate())) {
        wanDate = wanDate.minus({days: 7});
    }

    // LTX wan is on saturday instead of friday
    if(
      (wanDate.year == 2023 && wanDate.month == 7 && wanDate.day == 28) ||
      (wanDate.year == 2019 && wanDate.month == 7 && wanDate.day == 26)

    ) {
        wanDate = wanDate.plus({days: 1})
    }

    // 7/18/2023 skipped due to production shutdown (from GN callout)
    if(wanDate.year == 2023 && wanDate.month == 8 && wanDate.day == 18) {
        wanDate = wanDate.minus({days: 7});
    }

    return luxon ? wanDate : wanDate.toJSDate();
}

function getLooseWAN(now = new Date()) {
    let year = now.getUTCFullYear();
    let month = now.getUTCMonth() + 1;
    let day = now.getUTCHours() <= 3 ? now.getUTCDate() - 1 : now.getUTCDate();

    if(day <= 0) {
        month -= 1;
        day = daysInMonth(now.getFullYear(), month) + day;
    }

    if(month <= 0) {
        year -= 1;
        month += 12;
        day = daysInMonth(now.getFullYear(), month);
    }

    return DateTime.fromObject(
        {
            year,
            month,
            day,
            hour: 16,
            minute: 30
        }, {
            zone: "America/Vancouver"
        }
    );
}

export function getClosestWan(now = new Date()) {
    const next = getNextWAN(now, false) as Date;
    const previous = getPreviousWAN(now) as Date;

    const distanceToNext = Math.abs(next.getTime() - now.getTime());
    const distanceToPrevious = Math.abs(previous.getTime() - now.getTime());

    if(distanceToNext > distanceToPrevious) {
        return previous;
    } else {
        return next;
    }
}

export function getUTCDate(date = new Date()) {
    date = new Date(date); // clone since it might be modified
    if(date.getUTCHours() < 2) {
        // ensure the timezones don't mess with the date
        date.setUTCDate(date.getUTCDate() - 1)
    }
    const month = addZero(date.getUTCMonth() + 1);
    const day = addZero(date.getUTCDate());
    return date.getUTCFullYear() + "/" + month + "/" + day;
}

export function addZero(n: number): string {
    return n > 9 ? "" + n : "0" + n
}

export function getTimeUntil(date: Date, now = Date.now()) {
    let distance = date.getTime() - now;
    let late = false;
    if(distance < 0) {
        late = true;
        distance = Math.abs(distance)
    }

    const string = timeString(distance);

    return {
        string,
        late,
        distance
    };
}

export function timeString(distance: number) {
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysS = days > 0 ? days+"d " : "";
    const hoursS = hours > 0 ? hours+"h " : "";
    const minutesS = minutes > 0 ? minutes+"m " : "";
    const secondsS = seconds+"s ";

    return daysS + hoursS + minutesS + secondsS;
}

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();