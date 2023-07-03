export function wait(ms: number) {
    return new Promise((res) => {
        setTimeout(res, Math.floor(ms));
    });
}

export function random(min: number, max: number) {
    return (Math.random() * (max - min)) + min;
}