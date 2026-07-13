import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import { AuthConfirmModule } from './auth/auth_confirm/auth_confirm.module';
import { AuthSessionsModule } from './auth/auth_sessions/auth_sessions.module';
import { AuthStrategiesModule } from './auth/auth_strategies/auth_strategies.module';
import { ClientsModule } from './clients/clients.module';
import { ClientsRedirectsModule } from './clients/clients_redirects/clients_redirects.module';
import { FilesModule } from './files/files.module';
import { MailModule } from './mail/mail.module';
import { RandomModule } from './random/random.module';
import { TokenModule } from './token/token.module';

import { PersonsModule } from './db/persons/persons.module';
import { PostsModule } from './db/posts/posts.module';
import { PostsCategoriesModule } from './db/posts/posts_categories/posts_categories.module';
import { PostsTagsModule } from './db/posts/posts_tags/posts_tags.module';
import { SettingsModule } from './db/settings/settings.module';
import { SettingsGroupsModule } from './db/settings/settings_groups/settings_groups.module';
import { TestModule } from './db/test/test.module';
import { UsersModule } from './db/users/users.module';

export default [
  PassportModule.register({ session: true }),
  AuthModule,
  AuthConfirmModule,
  AuthSessionsModule,
  AuthStrategiesModule,
  ClientsModule,
  ClientsRedirectsModule,
  FilesModule,
  MailModule,
  RandomModule,
  TokenModule,

  PersonsModule,
  PostsModule,
  PostsCategoriesModule,
  PostsTagsModule,
  SettingsModule,
  SettingsGroupsModule,
  TestModule,
  UsersModule,
];
