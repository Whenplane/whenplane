import fs from 'node:fs/promises';


export async function fileExists(path: string) {
    return fs.access(path, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
}