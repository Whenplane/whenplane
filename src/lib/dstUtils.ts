
export function getDSTStart(year: number = new Date().getFullYear()): Date {
    const checking = new Date(year, 2, 1, 2, 0, 0, 0);
    checking.setUTCFullYear(year);
    checking.setUTCMonth(2);
    checking.setUTCDate(1);
    checking.setUTCHours(2 + 8);
    let foundFirst = false;
    let foundSecond = false;
    while(!foundSecond) {
        if(checking.getDay() == 0) {
            if(!foundFirst) {
                foundFirst = true;
            } else {
                foundSecond = true;
                break;
            }
            checking.setUTCDate(checking.getUTCDate() + 7);
        } else {
            checking.setUTCDate(checking.getUTCDate() + 1);
        }
    }

    return checking;
}

export function getDSTEnd(year: number = new Date().getFullYear()): Date {
    const checking = new Date(year, 2, 1, 2, 0, 0, 0);
    checking.setUTCFullYear(year);
    checking.setUTCMonth(10);
    checking.setUTCDate(1);
    checking.setUTCHours(2 + 7);
    let foundFirst = false;
    while(!foundFirst) {
        if(checking.getDay() == 0) {
            foundFirst = true;
            break;
        } else {
            checking.setUTCDate(checking.getUTCDate() + 1);
        }
    }

    return checking;
}