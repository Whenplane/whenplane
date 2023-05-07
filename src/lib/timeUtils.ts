// returns true if A is before B
import {getDSTEnd, getDSTStart} from "./dstUtils";

export function isBefore(a: Date, b: Date): boolean {
    return a.getTime() < b.getTime()
}

export function getNextWAN(): Date {
    const now = new Date();
    const wanDate = getLooseWAN();

    while(wanDate.getUTCDay() !== 5) {
        wanDate.setUTCDate(wanDate.getUTCDate() + 1);
    }

    // only say next week is next WAN 4 hours after WAN time
    if(isBefore(wanDate, now) && now.getTime() - wanDate.getTime() > 4 * 60 * 60 * 1e3) {
        wanDate.setUTCDate(wanDate.getUTCDate() + 7);
    }

    return wanDate;
}

export function getPreviousWAN(): Date {
    const wanDate = getLooseWAN();

    while(wanDate.getUTCDay() !== 5) {
        wanDate.setUTCDate(wanDate.getUTCDate() - 1);
    }

    if(isBefore(new Date(), wanDate)) {
        wanDate.setUTCDate(wanDate.getUTCDate() - 7);
    }

    return wanDate;
}

function getLooseWAN() {
    const now = new Date();
    const dst = isBefore(getDSTStart(), now) && isBefore(now, getDSTEnd());
    const offset = dst ? 7 : 8;
    const wanDate = new Date();
    wanDate.setUTCHours(6 - offset);
    wanDate.setUTCMinutes(30);
    wanDate.setUTCSeconds(0);
    wanDate.setUTCMilliseconds(0);

    return wanDate
}

export function getClosestWan() {
    const next = getNextWAN();
    const previous = getPreviousWAN();

    const distanceToNext = next.getTime() - Date.now();
    const distanceToPrevious = Date.now() - previous.getTime();

    if(distanceToNext > distanceToPrevious) {
        return previous;
    } else {
        return next;
    }
}

export function getTimeUntil(date: Date) {
    let distance = date.getTime() - Date.now();
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

export function getUTCDate(date = new Date()) {
    return date.getUTCFullYear() + "/" + date.getUTCMonth() + "/" + date.getUTCDate();
}