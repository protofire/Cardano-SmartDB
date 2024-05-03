
export interface GlobalBlockcahinTime {
    time: number | undefined;
    diffWithBlochain: number | undefined;
    lastFetch: number | undefined;
}
export const globalTime = {
    time: undefined,
    diffWithBlochain: undefined,
    lastFetch: undefined,
} as GlobalBlockcahinTime;
