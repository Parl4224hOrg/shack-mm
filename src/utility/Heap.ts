export class Heap<T> {
    private readonly heap: T[];
    private readonly compareFn: (a: T, b: T) => number = ((a: any, b: any) => a - b);

    // Is max heap by default if no compareFn is provided
    constructor(compareFn?: (a: T, b: T) => number) {
        this.heap = [];
        if (compareFn) {
            this.compareFn = compareFn;
        }
    }

    // Helper Methods
    private getLeftChildIndex(parentIndex: number): number { return 2 * parentIndex + 1; }
    private getRightChildIndex(parentIndex: number): number { return 2 * parentIndex + 2; }

    private getParentIndex(childIndex: number): number {
        return Math.floor((childIndex - 1) / 2);
    }

    private hasLeftChild(index: number): boolean {
        return this.getLeftChildIndex(index) < this.heap.length;
    }

    private hasRightChild(index: number): boolean {
        return this.getRightChildIndex(index) < this.heap.length;
    }

    private hasParent(index: number): boolean {
        return this.getParentIndex(index) >= 0;
    }

    private leftChild(index: number): T | null {
        return this.heap[this.getLeftChildIndex(index)] ?? null;
    }

    private rightChild(index: number): T | null {
        return this.heap[this.getRightChildIndex(index)] ?? null;
    }

    private parent(index: number): T | null {
        return this.heap[this.getParentIndex(index)] ?? null;
    }

    private swap(indexOne: number, indexTwo: number) {
        const temp = this.heap[indexOne];
        this.heap[indexOne] = this.heap[indexTwo];
        this.heap[indexTwo] = temp;
    }

    public peek(): T | null {
        if (this.heap.length === 0) {
            return null;
        }
        return this.heap[0];
    }

    // Removing an element will remove the
    // top element with the highest priority then
    // heapifyDown will be called
    public remove(): T | null {
        if (this.heap.length === 0) {
            return null;
        }
        const item = this.heap[0];
        this.heap[0] = this.heap[this.heap.length - 1];
        this.heap.pop();
        this.heapifyDown();
        return item;
    }

    public add(item: T) {
        this.heap.push(item);
        this.heapifyUp();
    }

    private heapifyUp() {
        let index = this.heap.length - 1;
        while (this.hasParent(index) && this.compareFn(this.parent(index)!, this.heap[index]) < 0) {
            this.swap(this.getParentIndex(index), index);
            index = this.getParentIndex(index);
        }
    }

    private heapifyDown() {
        let index = 0;
        while (this.hasLeftChild(index)) {
            let largerChildIndex = this.getLeftChildIndex(index);
            if (this.hasRightChild(index) && this.compareFn(this.rightChild(index)!, this.leftChild(index)!) > 0) {
                largerChildIndex = this.getRightChildIndex(index);
            }
            if (this.compareFn(this.heap[index], this.heap[largerChildIndex]) >= 0) {
                break;
            } else {
                this.swap(index, largerChildIndex);
            }
            index = largerChildIndex;
        }
    }

    public printHeap() {
        let heap = ` ${this.heap[0]} `;
        for(let i = 1; i<this.heap.length; i++) {
            heap += ` ${this.heap[i]} `;
        }
        console.log(heap);
    }
}