import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { CommentModule } from '../comment/comment.module';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [forwardRef(() => ArticleModule), forwardRef(() => CommentModule)],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
