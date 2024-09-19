import {addLastPlayedMap, getMaps} from "../match";

class Queue {
    public lastPlayedMaps: string[] = [];
}

const queue = new Queue();

class Data {
    public queue: Queue = queue;
    public getQueue() {
        return queue;
    }
}

const data = new Data();
const testPool = ["mapA", "mapB", "mapC", "mapD", "mapE", "mapF", "mapG", "mapH", "mapI", "mapJ"];

function getRandomInt(min: number, max: number): number {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

test("getMaps 1", () => {
    queue.lastPlayedMaps = ["mapA"];
    expect(getMaps(data as any, testPool)).toEqual(["mapB", "mapC", "mapD", "mapE", "mapF", "mapG", "mapH"]);
});

test("getMaps 2", () => {
    queue.lastPlayedMaps = ["mapA", "mapC", "mapF"];
    expect(getMaps(data as any, testPool)).toEqual(["mapB", "mapD", "mapE", "mapG", "mapH", "mapI", "mapJ"]);
});

test("addMaps 1", () => {
    queue.lastPlayedMaps = ["mapA"];
    addLastPlayedMap(data as any, "mapB");
    expect(queue.lastPlayedMaps).toEqual(["mapA", "mapB"]);
});

test("addMaps 2", () => {
    queue.lastPlayedMaps = ["mapA", "mapC", "mapD"];
    addLastPlayedMap(data as any, "mapB", testPool);
    expect(queue.lastPlayedMaps).toEqual(["mapC", "mapD", "mapB"]);
});

test("cohesive 1", () => {
    const numRuns = 10
    expect.assertions(7*numRuns);

    for (let i = 0; i < numRuns; i++) {
        queue.lastPlayedMaps = [];
        const maps1 = getMaps(data as any, testPool);
        const chosen1 = maps1[getRandomInt(0, 7)];
        addLastPlayedMap(data as any, chosen1, testPool);
        expect(queue.lastPlayedMaps).toEqual([chosen1]);

        const maps2 = getMaps(data as any, testPool);
        const chosen2 = maps2[getRandomInt(0, 7)];
        addLastPlayedMap(data as any, chosen2, testPool);
        expect(queue.lastPlayedMaps).toEqual([chosen1, chosen2]);

        const maps3 = getMaps(data as any, testPool);
        const chosen3 = maps3[getRandomInt(0, 7)];
        addLastPlayedMap(data as any, chosen3, testPool);
        expect(queue.lastPlayedMaps).toEqual([chosen1, chosen2, chosen3]);

        const maps4 = getMaps(data as any, testPool);
        const chosen4 = maps4[getRandomInt(0, 7)];
        addLastPlayedMap(data as any, chosen4, testPool);
        expect(queue.lastPlayedMaps).toEqual([chosen2, chosen3, chosen4]);

        expect(chosen1 == chosen2).toBe(false);
        expect(chosen2 == chosen3).toBe(false);
        expect(chosen3 == chosen4).toBe(false);
    }
});
