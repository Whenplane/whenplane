import { expect, test } from 'vitest'
import {getNextWAN} from "../../lib/timeUtils";

const alternateStartTimes = await fetch(
  'https://whenplane.com/api/alternateStartTimes'
).then((r) => r.json());

test('late show with hasDone=false', async () => {
    const testDate = new Date("2023-07-15T04:37:24.906Z") // 11:37 pm
    const next = getNextWAN(testDate, true, await alternateStartTimes, false);
    expect(next.getUTCDate()).toEqual(14);
})

test('late show with hasDone=true', async () => {
    const testDate = new Date("2023-07-15T04:37:24.906Z") // 11:37 pm
    const next = getNextWAN(testDate, true, await alternateStartTimes, true);
    expect(next.getUTCDate()).toEqual(21);
})

test('LTX 2023 exception', async () => {
    const testDate = new Date("2023-07-27T04:37:24.906Z")
    const next = getNextWAN(testDate, true, await alternateStartTimes, true);
    expect(next.getUTCDate()).toEqual(29);
})