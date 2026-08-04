import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1785628752870 implements MigrationInterface {
    name = 'InitialSchema1785628752870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "accounts" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "username" character varying(255) DEFAULT '', "password" character varying(255) DEFAULT '', "is_activated" smallint NOT NULL DEFAULT '0', "is_superuser" smallint NOT NULL DEFAULT '0', CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_477e3187cedfb5a3ac121e899c" ON "accounts" ("username") `);
        await queryRunner.query(`CREATE TABLE "settings_groups" ("id" BIGSERIAL NOT NULL, "name" character varying(100) DEFAULT '', "description" character varying(1024) DEFAULT '', "position" integer DEFAULT '2147483647', "is_disabled" smallint NOT NULL DEFAULT '0', CONSTRAINT "PK_a0f67b2060b2613826efaa885dc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."settings_type_enum" AS ENUM('', 'boolean', 'json', 'number', 'string')`);
        await queryRunner.query(`CREATE TABLE "settings" ("id" BIGSERIAL NOT NULL, "name" character varying(100) DEFAULT '', "description" character varying(1024) DEFAULT '', "type" "public"."settings_type_enum" DEFAULT '', "position" integer DEFAULT '2147483647', "default" text, "value" text, "is_disabled" smallint NOT NULL DEFAULT '0', "settings_group_id" bigint, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts_categories" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(255) DEFAULT '', CONSTRAINT "PK_5d3b2df4bf38bca8b037cb19068" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(255) DEFAULT '', "content" text, "published_at" TIMESTAMP, "is_published" smallint NOT NULL DEFAULT '0', "secret_notes" text, "account_id" bigint, "posts_category_id" bigint, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts_tags" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(255) DEFAULT '', CONSTRAINT "PK_656b2add759eea9e914ea0d6ce9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts_by_posts_tags" ("postsId" bigint NOT NULL, "postsTagsId" bigint NOT NULL, CONSTRAINT "PK_3f2f96f1fe9608089bf7ea843ac" PRIMARY KEY ("postsId", "postsTagsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bc4decd65e380646a626e59ddf" ON "posts_by_posts_tags" ("postsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_21f9f1245acb97ef02147cbf1d" ON "posts_by_posts_tags" ("postsTagsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_posts_account" ON "posts" ("account_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_posts_category" ON "posts" ("posts_category_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_settings_group" ON "settings" ("settings_group_id") `);
        await queryRunner.query(`ALTER TABLE "settings" ADD CONSTRAINT "FK_981c30d9c5b661d3a9129204b67" FOREIGN KEY ("settings_group_id") REFERENCES "settings_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_e3bab03a7dee745151598930014" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_6a0cb274a748fd78b322eb0390f" FOREIGN KEY ("posts_category_id") REFERENCES "posts_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "posts_by_posts_tags" ADD CONSTRAINT "FK_bc4decd65e380646a626e59ddfa" FOREIGN KEY ("postsId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "posts_by_posts_tags" ADD CONSTRAINT "FK_21f9f1245acb97ef02147cbf1db" FOREIGN KEY ("postsTagsId") REFERENCES "posts_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts_by_posts_tags" DROP CONSTRAINT "FK_21f9f1245acb97ef02147cbf1db"`);
        await queryRunner.query(`ALTER TABLE "posts_by_posts_tags" DROP CONSTRAINT "FK_bc4decd65e380646a626e59ddfa"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_6a0cb274a748fd78b322eb0390f"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_e3bab03a7dee745151598930014"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP CONSTRAINT "FK_981c30d9c5b661d3a9129204b67"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_settings_group"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_posts_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_posts_account"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21f9f1245acb97ef02147cbf1d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bc4decd65e380646a626e59ddf"`);
        await queryRunner.query(`DROP TABLE "posts_by_posts_tags"`);
        await queryRunner.query(`DROP TABLE "posts_tags"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "posts_categories"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TYPE "public"."settings_type_enum"`);
        await queryRunner.query(`DROP TABLE "settings_groups"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_477e3187cedfb5a3ac121e899c"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
    }
}
