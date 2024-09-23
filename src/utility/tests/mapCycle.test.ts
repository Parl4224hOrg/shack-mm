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

