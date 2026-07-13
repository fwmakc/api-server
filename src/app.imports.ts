import { PassportModule } from '@nestjs/passport';
import { AccountModule } from './account/account.module';
import { AccountConfirmModule } from './account/account_confirm/account_confirm.module';
import { AccountSessionsModule } from './account/account_sessions/account_sessions.module';
import { AccountStrategiesModule } from './account/account_strategies/account_strategies.module';
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
  AccountModule,
  AccountConfirmModule,
  AccountSessionsModule,
  AccountStrategiesModule,
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
