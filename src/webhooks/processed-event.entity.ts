import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/**
 * Журнал дедупликации вебхук-доставок. `eventId` приходит из конверта
 * event-server; уникальный индекс превращает повторную доставку (ретрай,
 * ределивери после таймаута) в no-op вместо повторной мутации зеркала.
 * Строка пишется в той же транзакции, что и мутация зеркала, — краш не
 * может ни потерять обработку, ни применить её дважды.
 *
 * Прямые декораторы TypeORM (не колонки тулкита): колонка должна быть
 * NOT NULL, а индекс — явно именованным, чтобы миграция и сущность
 * совпадали байт-в-байт (паттерн event-server audit).
 */
@Entity("webhook_processed_events")
@Index("idx_webhook_processed_events_event_id", ["eventId"], { unique: true })
export class ProcessedEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "event_id", type: "varchar" })
  eventId: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
