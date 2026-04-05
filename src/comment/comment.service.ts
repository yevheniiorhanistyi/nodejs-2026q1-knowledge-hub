import { randomUUID } from 'node:crypto';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';

import { ArticleService } from 'src/article/article.service';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentService {
  private comments: Comment[] = [];

  constructor(
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  create(createCommentDto: CreateCommentDto) {
    try {
      this.articleService.findOne(createCommentDto.articleId);
    } catch (e) {
      throw new UnprocessableEntityException('Article does not exist');
    }

    const newComment = new Comment();
    Object.assign(newComment, {
      id: randomUUID(),
      ...createCommentDto,
      authorId: createCommentDto.authorId ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    this.comments.push(newComment);
    return newComment;
  }

  findOne(id: string) {
    const comment = this.comments.find((c) => c.id === id);
    if (!comment) throw new NotFoundException();
    return comment;
  }

  findByArticleId(id: string) {
    return this.comments.filter((c) => c.articleId === id);
  }

  remove(id: string) {
    const comments = this.comments.filter((c) => c.id !== id);
    if (comments.length === this.comments.length) throw new NotFoundException();

    this.comments = comments;
  }

  removeByArticleId(articleId: string) {
    this.comments = this.comments.filter((c) => c.articleId !== articleId);
  }

  removeByAuthorId(authorId: string) {
    this.comments = this.comments.filter((c) => c.authorId !== authorId);
  }
}
