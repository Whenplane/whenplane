import {DateTime} from "luxon";
import type { AlternateTimeRow } from "../routes/api/alternateStartTimes/+server.ts";

// returns true if A is before B
export function isBefore(a: Date, b: Date): boolean {
    return a.getTime() < b.getTime()
}

export function getNextWANLuxon(now = new Date(), buffer = true, alternateTimes?: AlternateTimeRow[], hasDone?: boolean): DateTime {
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
            console.debug({hasDone, shouldStay})
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

    // If the show ends before the normal time, go ahead and skip over it
    if(hasDone && wanDate.toMillis() - now.getTime() < 24 * 60 * 60e3) {
        wanDate = wanDate.plus({days: 7})
    }

    if(alternateTimes) {
        const dateString = `${wanDate.year}/${addZero(wanDate.month)}/${addZero(wanDate.day)}`;
        const adjustment = alternateTimes.find(t => t.date === dateString);
        if(adjustment) {
            if(adjustment.days) {
                wanDate = wanDate.plus({days: adjustment.days})
            }
            wanDate = wanDate.set({
                hour: adjustment.hour ?? undefined,
                minute: adjustment.minute ?? undefined
            })
        }
    }

    // 7/18/2023 skipped due to production shutdown (from GN callout)
    if(wanDate.year == 2023 && wanDate.month == 8 && wanDate.day == 18) {
        wanDate = wanDate.plus({days: 7});
    }

    return wanDate;
}

export function getNextWAN(now = new Date(), buffer = true, alternateTimes?: AlternateTimeRow[], hasDone?: boolean): Date {
    return getNextWANLuxon(now, buffer, alternateTimes, hasDone).toJSDate();
}

export function getPreviousWANLuxon(now = new Date(), alternateTimes?: AlternateTimeRow[]): DateTime {
    let wanDate = getLooseWAN(now);

    while(wanDate.weekday !== 5) {
        wanDate = wanDate.minus({days: 1});
    }

    if(isBefore(now, wanDate.toJSDate())) {
        wanDate = wanDate.minus({days: 7});
    }

    if(alternateTimes) {
        const dateString = `${wanDate.year}/${addZero(wanDate.month)}/${addZero(wanDate.day)}`;
        const adjustment = alternateTimes?.find(t => t.date === dateString);
        if(adjustment) {
            if(adjustment.days) {
                wanDate = wanDate.plus({days: adjustment.days})
            }
            wanDate = wanDate.set({
                hour: adjustment.hour ?? undefined,
                minute: adjustment.minute ?? undefined
            })
        }
    }

    // 7/18/2023 skipped due to production shutdown (from GN callout)
    if(wanDate.year == 2023 && wanDate.month == 8 && wanDate.day == 18) {
        wanDate = wanDate.minus({days: 7});
    }

    return wanDate;
}
export function getPreviousWAN(now = new Date(), alternateTimes?: AlternateTimeRow[]): Date {
    return getPreviousWANLuxon(now, alternateTimes).toJSDate()
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

export function getClosestWanLuxon(now = new Date(), alternateTimes?: AlternateTimeRow[]) {
    const next = getNextWANLuxon(now, false, alternateTimes);
    const previous = getPreviousWANLuxon(now, alternateTimes);

    const distanceToNext = Math.abs(next.toMillis() - now.getTime());
    const distanceToPrevious = Math.abs(previous.toMillis() - now.getTime());

    if(distanceToNext > distanceToPrevious) {
        return previous;
    } else {
        return next;
    }
}
export function getClosestWan(now = new Date(), alternateTimes?: AlternateTimeRow[]) {
    return getClosestWanLuxon(now, alternateTimes).toJSDate();
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

export function dateToNumber(date: string) {
    return Number(date.replaceAll("/", ""))
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

export function timeString(distance: number | undefined, long = false, showSeconds = true) {
    if(distance == undefined) return undefined;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const d = long ? (days != 1 ? " days " : " day ") : "d ";
    const h = long ? (hours != 1 ? " hours " : " hour ") : "h ";
    const m = long ? (minutes != 1 ? " minutes " : " minute ") : "m ";
    const s = long ? (seconds != 1 ? " seconds " : " second ") : "s ";

    const daysS = days > 0 ? days+d : "";
    const hoursS = hours > 0 ? hours+h : "";
    const minutesS = minutes > 0 ? minutes+m : "";
    const and = (long && (daysS || hoursS || minutesS)) ? "and " : "";
    const secondsS = seconds+s;

    return daysS + hoursS + minutesS + (showSeconds ? and + secondsS : minutes > 0 ? "" : "<1 minute");
}

export function colonTimeString(distance: number | undefined) {
    if(distance == undefined) return undefined;
    const hours = Math.floor((distance) / (60 * 60));
    const minutes = Math.floor((distance % (60 * 60)) / 60);
    const seconds = Math.floor((distance % 60));

    const hoursS = hours > 0 ? addZero(hours)+":" : "";
    const minutesS = addZero(minutes)+":";
    const secondsS = addZero(seconds);

    return hoursS + minutesS + secondsS
}

export function timeStringHours(distance: number | undefined, long = false) {
    if(distance == undefined) return undefined;
    const hours = Math.floor((distance) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const h = long ? (hours != 1 ? " hours " : " hour ") : "h ";
    const m = long ? (minutes != 1 ? " minutes " : " minute ") : "m ";
    const s = long ? (seconds != 1 ? " seconds " : " second ") : "s ";

    const hoursS = hours > 0 ? hours+h : "";
    const minutesS = minutes > 0 ? minutes+m : "";
    const and = (long && (hoursS || minutesS)) ? "and " : "";
    const secondsS = seconds+s;

    return hoursS + minutesS + and + secondsS;
}

const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

export function n() {
    return Date.now();
}

/**
 * Checks if its near wan time (for purposes of throttling checks)
 */
export function isNearWan(now?: Date) {
    const d = now ? now : new Date();
    if(d.getUTCDay() === 5) {
        return d.getUTCHours() > 20;
    } else if(d.getUTCDay() === 6) {
        return d.getUTCHours() <= 11;
    } else {
        return false;
    }
}

export function isLargeNearWan(now?: Date) {
    const d = now ? now : new Date();
    if(d.getUTCDay() === 5) {
        return d.getUTCHours() >= 17;
    } else if(d.getUTCDay() === 6) {
        return d.getUTCHours() <= 14;
    } else {
        return false;
    }
}

export const shortMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];

export function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getDate() == b.getDate() &&
      a.getMonth() == b.getMonth() &&
      a.getFullYear() == b.getFullYear()
    );
}

export function yesterday() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
}
