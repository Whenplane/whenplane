import { expect, test } from 'vitest'
import {getNextWAN} from "../../lib/timeUtils";

test('late show with hasDone=false', () => {
    const testDate = new Date("2023-07-15T04:37:24.906Z") // 11:37 pm
    const next = getNextWAN(testDate, true, false);
    expect(next.getUTCDate()).toEqual(14);
})

test('late show with hasDone=true', () => {
    const testDate = new Date("2023-07-15T04:37:24.906Z") // 11:37 pm
    const next = getNextWAN(testDate, true, true);
    expect(next.getUTCDate()).toEqual(21);
})

test('LTX 2023 exception', () => {
    const testDate = new Date("2023-07-27T04:37:24.906Z")
    const next = getNextWAN(testDate, true, true);
    expect(next.getUTCDate()).toEqual(29);
})