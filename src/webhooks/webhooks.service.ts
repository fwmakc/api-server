import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, EntityManager } from "typeorm";
import {
  WebhookEnvelopeDto,
  UserRegisteredDto,
  UserConfirmedDto,
  UserDeactivatedDto,
  UserDeletedDto,
} from "event-server/contracts";
import { ProcessedEventEntity } from "./processed-event.entity";

/**
 * Проекция аккаунтов (accounts-mirror). auth-server владеет аккаунтами;
 * api-server держит локальную read-only проекцию, чтобы FK
 * posts.account_id мог существовать. Строки пишутся ТОЛЬКО из событий
 * шины — CRUD-маршрута у зеркала нет (AccountService не публикует
 * контроллер). Колонка `password` остаётся NULL: зеркало не видит и не
 * хранит учётные данные.
 *
 * Семантика каждой ветки — «поздний заказ не может перезаписать новое
 * состояние»: registered вставляет через ON CONFLICT DO NOTHING (повторная
 * доставка не сбросит is_activated поверх подтверждения), confirmed/
 * deactivated — DO UPDATE (заодно лечат потерянный registered: строка
 * создаётся на месте), deleted удаляет, а при FK-конфликте (у автора есть
 * посты, posts.account_id — NO ACTION) оставляет инертный tombstone.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async handleEvent(event: WebhookEnvelopeDto): Promise<void> {
    this.logger.log(
      `Received event: ${event.pattern} from ${event.source} (eventId=${event.eventId})`,
    );

    switch (event.pattern) {
      case "user.registered":
        await this.processOnce(
          event,
          (em) => this.onRegistered(em, event.payload as UserRegisteredDto),
        );
        break;
      case "user.confirmed":
        await this.processOnce(
          event,
          (em) => this.onConfirmed(em, event.payload as UserConfirmedDto),
        );
        break;
      case "user.deactivated":
        await this.processOnce(
          event,
          (em) => this.onDeactivated(em, event.payload as UserDeactivatedDto),
        );
        break;
      case "user.deleted":
        await this.processOnce(
          event,
          (em) => this.onDeleted(em, event.payload as UserDeletedDto),
        );
        break;
      default:
        this.logger.warn(`No handler for pattern: ${event.pattern}`);
    }
  }

  /**
   * Отмечает событие обработанным и применяет мутацию зеркала в ОДНОЙ
   * транзакции: `ON CONFLICT DO NOTHING` на уникальном eventId делает
   * повторную доставку no-op, а общая транзакция не даёт крашу ни потерять
   * мутацию, ни применить её дважды. Ошибка хендлера пробрасывается —
   * event-server повторит доставку.
   */
  private async processOnce(
    event: WebhookEnvelopeDto,
    handler: (em: EntityManager) => Promise<void>,
  ): Promise<void> {
    const processed = await this.dataSource.transaction(async (em) => {
      const inserted = await em
        .createQueryBuilder()
        .insert()
        .into(ProcessedEventEntity)
        .values({ eventId: String(event.eventId) })
        .orIgnore()
        .returning("id")
        .execute();

      if (inserted.raw.length === 0) return false;

      await handler(em);
      return true;
    });

    if (!processed) {
      this.logger.log(
        `Duplicate delivery skipped (eventId=${event.eventId}, pattern=${event.pattern})`,
      );
    }
  }

  private async onRegistered(
    em: EntityManager,
    payload: UserRegisteredDto,
  ): Promise<void> {
    // confirmUrl отсутствует у заранее активированной регистрации;
    // is_activated — SMALLINT (BooleanColumn тулкита), значения 0/1
    await em.query(
      `INSERT INTO "accounts" ("id", "username", "is_activated")
       VALUES ($1, $2, $3) ON CONFLICT ("id") DO NOTHING`,
      [payload.userId, payload.username, payload.confirmUrl ? 0 : 1],
    );
    this.logger.log(`Mirrored user.registered: userId=${payload.userId}`);
  }

  private async onConfirmed(
    em: EntityManager,
    payload: UserConfirmedDto,
  ): Promise<void> {
    await em.query(
      `INSERT INTO "accounts" ("id", "username", "is_activated")
       VALUES ($1, $2, 1) ON CONFLICT ("id")
       DO UPDATE SET "is_activated" = 1, "username" = EXCLUDED."username"`,
      [payload.userId, payload.username],
    );
    this.logger.log(`Mirrored user.confirmed: userId=${payload.userId}`);
  }

  private async onDeactivated(
    em: EntityManager,
    payload: UserDeactivatedDto,
  ): Promise<void> {
    await em.query(
      `INSERT INTO "accounts" ("id", "username", "is_activated")
       VALUES ($1, $2, 0) ON CONFLICT ("id")
       DO UPDATE SET "is_activated" = 0, "username" = EXCLUDED."username"`,
      [payload.userId, payload.username],
    );
    this.logger.log(`Mirrored user.deactivated: userId=${payload.userId}`);
  }

  private async onDeleted(
    em: EntityManager,
    payload: UserDeletedDto,
  ): Promise<void> {
    try {
      await em.query(`DELETE FROM "accounts" WHERE "id" = $1`, [
        payload.userId,
      ]);
    } catch (err: any) {
      if (err?.code === "23503") {
        this.logger.warn(
          `user.deleted: mirror row ${payload.userId} kept as tombstone (posts reference it)`,
        );
        return;
      }
      throw err;
    }
    this.logger.log(`Mirrored user.deleted: userId=${payload.userId}`);
  }
}
