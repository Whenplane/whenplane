// returns true if A is before B
import {getDSTEnd, getDSTStart} from "./dstUtils";

export function isBefore(a: Date, b: Date): boolean {
    return a.getTime() < b.getTime()
}

export function getNextWAN(): Date {
    const now = new Date();
    const dst = isBefore(getDSTStart(), now) && isBefore(now, getDSTEnd());
    const offset = dst ? 7 : 8;
    const wanDate = new Date();
    wanDate.setUTCHours(6 - offset);
    wanDate.setUTCMinutes(30);
    wanDate.setUTCSeconds(0);
    wanDate.setUTCMilliseconds(0);

    while(wanDate.getUTCDay() !== 5) {
        wanDate.setUTCDate(wanDate.getUTCDate() + 1);
    }

    if(isBefore(wanDate, now)) {
        wanDate.setUTCDate(wanDate.getUTCDate() + 7);
    }

    return wanDate;
}

export function getTimeUntil(date: Date) {
    const distance = date.getTime() - Date.now();
    if(distance < 0 || typeof distance == 'undefined') {
        return "now";
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
    return daysS + hoursS + minutesS + secondsS;
}