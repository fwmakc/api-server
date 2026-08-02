import { Logger } from "@nestjs/common";
import { bootstrap } from "api-server-toolkit/bootstrap";
import { AppModule } from "@src/app.module";
import { startMetrics } from "@src/app.metrics";

const logger = new Logger("Bootstrap");

bootstrap({
  module: AppModule,
  serviceName: "api-server",
  cors: true,
  morgan: true,
  cookieParser: true,
  passport: true,
  transactional: true,
  beforeListen: () => {
    if (process.env.METRICS_ENABLE === "true") {
      logger.log("Starting performance monitoring...");
      startMetrics();
    }
  },
});
