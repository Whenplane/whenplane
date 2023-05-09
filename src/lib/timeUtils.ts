import {getDSTEnd, getDSTStart} from "./dstUtils";

// returns true if A is before B
export function isBefore(a: Date, b: Date): boolean {
    return a.getTime() < b.getTime()
}

export function getNextWAN(now = new Date(), buffer = true): Date {
    const wanDate = getLooseWAN(now);

    while(wanDate.getUTCDay() !== 5) {
        wanDate.setUTCDate(wanDate.getUTCDate() + 1);
    }

    // only say next week is next WAN 4 hours after WAN time
    if(isBefore(wanDate, now) && (buffer ? now.getTime() - wanDate.getTime() > 4 * 60 * 60 * 1e3 : true)) {
        wanDate.setUTCDate(wanDate.getUTCDate() + 7);
    }

    return wanDate;
}

export function getPreviousWAN(now = new Date()): Date {
    const wanDate = getLooseWAN(now);

    while(wanDate.getUTCDay() !== 5) {
        wanDate.setUTCDate(wanDate.getUTCDate() - 1);
    }

    if(isBefore(now, wanDate)) {
        wanDate.setUTCDate(wanDate.getUTCDate() - 7);
    }

    return wanDate;
}

function getLooseWAN(now = new Date()) {
    const dst = isBefore(getDSTStart(), now) && isBefore(now, getDSTEnd());
    const offset = dst ? 7 : 8;
    const wanDate = new Date(now);
    wanDate.setUTCHours(6 - offset);
    wanDate.setUTCMinutes(30);
    wanDate.setUTCSeconds(0);
    wanDate.setUTCMilliseconds(0);

    return wanDate;
}

export function getClosestWan(now = new Date()) {
    const next = getNextWAN(now, false);
    const previous = getPreviousWAN(now);

    const distanceToNext = next.getTime() - now.getTime();
    const distanceToPrevious = now.getTime() - previous.getTime();

    if(distanceToNext > distanceToPrevious) {
        return previous;
    } else {
        return next;
    }
}

export function getUTCDate(date = new Date()) {
    const month = addZero(date.getUTCMonth() + 1);
    const day = addZero(date.getUTCDate());
    return date.getUTCFullYear() + "/" + month + "/" + day;
}

export function addZero(thing: number): string {
    return thing > 9 ? "" + thing : "0" + thing
}

export function getTimeUntil(date: Date, now = Date.now()) {
    let distance = date.getTime() - now;
    let late = false;
    if(distance < 0) {
        late = true;
        distance = Math.abs(distance)
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysS = days > 0 ? days+"d " : "";
    const hoursS = hours > 0 ? hours+"h " : "";
    let minutesS = minutes > 0 ? minutes+"m " : "";
    let secondsS = seconds+"s ";
    if(typeof location !== 'undefined' && location.pathname === "/rmtv") {
        minutesS = minutes+" minute" + (minutes === 1 ? " " : "s ");
        secondsS = "";
    }
    return {
        string: daysS + hoursS + minutesS + secondsS,
        late
    };
}