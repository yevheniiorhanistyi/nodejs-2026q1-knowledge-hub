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
import { Comment } from './entities/comment.entity';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('Comment')
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiCreatedResponse({ type: Comment })
  create(@Body() createCommentDto: CreateCommentDto): Comment {
    return this.commentService.create(createCommentDto);
  }

  @Get()
  @ApiOkResponse({ type: [Comment] })
  findAll(@Query('articleId', new ParseUUIDPipe()) articleId: string) {
    return this.commentService.findByArticleId(articleId);
  }

  @Get(':id')
  @ApiOkResponse({ type: Comment })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.commentService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.commentService.remove(id);
  }
}
