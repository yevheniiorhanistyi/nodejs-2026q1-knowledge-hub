import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Comment } from '@prisma/client';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comment')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The comment has been successfully created.',
  })
  create(@Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    return this.commentService.create(createCommentDto);
  }

  @Get()
  @ApiOkResponse({
    description: 'Returns a list of comments.',
  })
  findAll(@Query('articleId', new ParseUUIDPipe()) articleId: string) {
    return this.commentService.findByArticleId(articleId);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Returns the requested comment.',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.commentService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.commentService.remove(id);
  }
}
