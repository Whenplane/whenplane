// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Locals {}
	// interface PageData {}
	// interface Error {}
    interface Platform {
        env?: {
            CACHE: KVNamespace;
            HISTORY: KVNamespace;
        }
    }
}

type KVListResponse = {
    keys: {
        name: string,
        metadata: {
            submitted: number,
            [key: string]: string
        }
    }[],
    list_complete: boolean,
    cursor: string
}
