import { PassportModule } from '@nestjs/passport';
import { AuthClientModule } from './auth-client/auth-client.module';
import { AccountModule } from './account/account.module';

import { PostsModule } from './db/posts/posts.module';
import { PostsCategoriesModule } from './db/posts/posts_categories/posts_categories.module';
import { PostsTagsModule } from './db/posts/posts_tags/posts_tags.module';
import { SettingsModule } from './db/settings/settings.module';
import { SettingsGroupsModule } from './db/settings/settings_groups/settings_groups.module';
import { TestModule } from './db/test/test.module';

export default [
  PassportModule,
  AuthClientModule,
  AccountModule,

  PostsModule,
  PostsCategoriesModule,
  PostsTagsModule,
  SettingsModule,
  SettingsGroupsModule,
  TestModule,
];
