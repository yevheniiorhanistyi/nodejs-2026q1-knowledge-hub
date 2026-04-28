import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommentDto) {
    const article = await this.prisma.article.findUnique({
      where: { id: dto.articleId },
    });
    if (!article)
      throw new UnprocessableEntityException('Article does not exist');

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        articleId: dto.articleId,
        authorId: dto.authorId,
      },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException();
    return comment;
  }

  async findByArticleId(articleId: string) {
    return this.prisma.comment.findMany({ where: { articleId } });
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException();
    await this.prisma.comment.delete({ where: { id } });
  }
}
