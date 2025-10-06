export class RateLimitedQueue {
    private running = 0;
    private q: Array<() => Promise<void>> = [];
    private lastRun = 0;

    constructor(
        private readonly concurrency = 1,
        private readonly minDelayMs = 750
    ) {}

    queue(task: () => Promise<void>) {
        this.q.push(task);
        this.pump().then();
    }

    private async pump() {
        while (this.running < this.concurrency && this.q.length) {
            const now = Date.now();
            const wait = Math.max(0, this.minDelayMs - (now - this.lastRun));
            const job = this.q.shift()!;
            this.running++;
            setTimeout(async () => {
                try { await job(); }
                catch (e) { console.warn('Background job failed:', e); }
                finally {
                    this.lastRun = Date.now();
                    this.running--;
                    setImmediate(() => this.pump());
                }
            }, wait);
        }
    }
}
