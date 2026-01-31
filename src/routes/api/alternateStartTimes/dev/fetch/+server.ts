import { dev } from '$app/environment';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { wait } from '$lib/utils.ts';
import { _createTables as createTables, type AlternateTimeRow } from '../../+server.ts';

export const GET = (async ({ platform, fetch }) => {
	if (!dev) throw error(503, 'Not available in prod');

	const db = platform?.env?.DB;
	if (!db) throw error(503, 'DB unavailable!');

	const alternateTimes: AlternateTimeRow[] = await fetch(
		'https://whenplane.com/api/alternateStartTimes'
	).then((res) => res.json());

	console.log(`Fetched ${alternateTimes.length} alternate start times from prod`);

	await db.prepare('drop table if exists alternate_times').run();

	await wait(500);

	await createTables(db);

	for (const time of alternateTimes) {
		await db
			.prepare(
				'insert or replace into alternate_times(date, days, hour, minute) values (?, ?, ?, ?)'
			)
			.bind(time.date, time.days ?? null, time.hour ?? null, time.minute ?? null)
			.run();
	}

	console.log('Done inserting alternate start times!');
	return json({
		done: true,
		count: alternateTimes.length
	});
}) satisfies RequestHandler;
