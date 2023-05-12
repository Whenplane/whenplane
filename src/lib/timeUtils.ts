import {DateTime} from "luxon";

// returns true if A is before B
export function isBefore(a: Date, b: Date): boolean {
    return a.getTime() < b.getTime()
}

export function getNextWAN(now = new Date(), buffer = true): Date {
    let wanDate = getLooseWAN(now);

    while(wanDate.weekday !== 5) {
        wanDate = wanDate.plus({days: 1});
    }

    // only say next week is next WAN 4 hours after WAN time
    if(isBefore(wanDate.toJSDate(), now) && (buffer ? now.getTime() - wanDate.toJSDate().getTime() > 4 * 60 * 60 * 1e3 : true)) {
        wanDate = wanDate.plus({days: 7});
    }

    return wanDate.toJSDate();
}

export function getPreviousWAN(now = new Date()): Date {
    let wanDate = getLooseWAN(now);

    while(wanDate.weekday !== 5) {
        wanDate = wanDate.minus({days: 1});
    }

    if(isBefore(now, wanDate.toJSDate())) {
        wanDate = wanDate.plus({days: 7});
    }

    return wanDate.toJSDate();
}

function getLooseWAN(now = new Date()) {
    const wanDate = DateTime.fromObject(
        {
            year: now.getFullYear(),
            month: now.getMonth()+1,
            day: now.getDate(),
            hour: 16,
            minute: 30
        }, {
            zone: "America/Vancouver"
        }
        );

    console.log({looseWan: wanDate});
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
    const minutesS = minutes > 0 ? minutes+"m " : "";
    const secondsS = seconds+"s ";

    return {
        string: daysS + hoursS + minutesS + secondsS,
        late
    };
}