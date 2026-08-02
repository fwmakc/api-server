import { Logger } from "@nestjs/common";

const INTERVAL = 10000;
const LAG_THRESHOLD = 100;

export function startMetrics(): void {
  const logger = new Logger("Metrics");

  let lastCheck = process.hrtime.bigint();
  let maxLag = 0;
  let lagCount = 0;

  setInterval(() => {
    const now = process.hrtime.bigint();
    const lag =
      Number(now - lastCheck - BigInt(INTERVAL * 1_000_000)) / 1_000_000;

    lastCheck = now;

    if (lag > maxLag) maxLag = lag;
    if (lag > LAG_THRESHOLD) lagCount++;

    const memory = process.memoryUsage();
    const heapUsedMB = (memory.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (memory.heapTotal / 1024 / 1024).toFixed(2);
    const rssMB = (memory.rss / 1024 / 1024).toFixed(2);
    const heapPercent = ((memory.heapUsed / memory.heapTotal) * 100).toFixed(1);

    logger.log(
      `eventLoop lag=${lag.toFixed(2)}ms max=${maxLag.toFixed(2)}ms events=${lagCount} ${lag > LAG_THRESHOLD ? "SLOW" : "OK"} | heap=${heapUsedMB}/${heapTotalMB}MB (${heapPercent}%) rss=${rssMB}MB ${Number(heapPercent) > 90 ? "HIGH" : "OK"} | uptime=${new Date(process.uptime() * 1000).toISOString().substr(11, 8)}`,
    );

    if (process.uptime() % 60 < 10) {
      maxLag = 0;
      lagCount = 0;
    }
  }, INTERVAL);

  let lastImmediate = Date.now();

  function checkImmediate() {
    const now = Date.now();
    const delay = now - lastImmediate;

    if (delay > 1000) {
      logger.warn(
        `Event loop blocked for ${delay}ms at ${new Date().toISOString()}`,
      );
    }

    lastImmediate = now;
    setImmediate(checkImmediate);
  }

  setImmediate(checkImmediate);
}
