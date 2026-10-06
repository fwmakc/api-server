import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { httpPost } from "api-server-toolkit/helper";

@Injectable()
export class SubscriberService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SubscriberService.name);
  private readonly eventServerUrl: string;
  private readonly apiKey: string;
  private readonly webhookUrl: string;
  private readonly webhookSecret?: string;
  // Всё, что меняет/accounts-зеркало: жизненный цикл аккаунта целиком.
  private readonly patterns = [
    "user.registered",
    "user.confirmed",
    "user.deactivated",
    "user.deleted",
  ];

  constructor(private readonly config: ConfigService) {
    this.eventServerUrl = this.config.get<string>(
      "EVENT_SERVER_URL",
      "http://event-server:3005",
    );
    this.apiKey = this.config.get<string>("INTERNAL_API_KEY", "changeme");
    const prefix = this.config.get<string>("PREFIX", "");
    this.webhookUrl = this.config.get<string>(
      "WEBHOOK_URL",
      `http://api-server:5000${prefix ? `/${prefix}` : ""}/webhooks/events`,
    );
    // Общий HMAC-секрет подписанных доставок. Передаётся при регистрации,
    // event-server сохраняет его для подписчика; EventDeliveryGuard
    // проверяет X-Event-Signature. Не задан — легаси-транспорт с общим
    // внутренним ключом (для ужесточения задать WEBHOOK_SECRET на ОБЕИХ
    // сторонах).
    this.webhookSecret =
      this.config.get<string>("WEBHOOK_SECRET") || undefined;
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.register();
  }

  private async register(retry = 0): Promise<void> {
    try {
      await httpPost(
        `${this.eventServerUrl}/subscribe`,
        {
          service: "api-server",
          url: this.webhookUrl,
          patterns: this.patterns,
          active: true,
          // Регистрация идемпотентна (тот же service+url мержится): свежий
          // секрет перепрописывает сохранённый, например после ротации.
          ...(this.webhookSecret ? { secret: this.webhookSecret } : {}),
        },
        {
          headers: { "X-Internal-Api-Key": this.apiKey },
          timeout: 5000,
        },
      );

      if (this.webhookSecret) {
        this.logger.log(
          `Subscribed to event-server (patterns: ${this.patterns.join(", ")}, signed delivery)`,
        );
      } else {
        this.logger.warn(
          `Subscribed to event-server WITHOUT a delivery secret — webhook accepts the shared internal key. Set WEBHOOK_SECRET (same value on event-server) to enable HMAC-signed delivery.`,
        );
      }
    } catch (err) {
      if (retry < 5) {
        const delay = Math.pow(2, retry) * 1000;
        this.logger.warn(
          `Failed to subscribe to event-server (attempt ${retry + 1}/6), retrying in ${delay / 1000}s: ${err.message || err}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        await this.register(retry + 1);
      } else {
        this.logger.error(
          `Failed to subscribe to event-server after 6 attempts: ${err.message || err}`,
        );
      }
    }
  }
}
