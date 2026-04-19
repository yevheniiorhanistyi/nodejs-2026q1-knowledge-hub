import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Article } from '@prisma/client';

import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

import { ArticleStatus } from './article.types';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Article')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Roles('admin', 'editor')
  @Post()
  @ApiCreatedResponse({
    description: 'The article has been successfully created.',
  })
  create(@Body() createArticleDto: CreateArticleDto): Promise<Article> {
    return this.articleService.create(createArticleDto);
  }

  @Public()
  @Get()
  @ApiOkResponse({ description: 'Returns a list of articles.' })
  @ApiQuery({ name: 'status', required: false, enum: ArticleStatus })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('tag') tag?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.articleService.findAll(status, tag, categoryId);
  }

  @Public()
  @Get(':id')
  @ApiOkResponse({ description: 'Returns the requested article.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.articleService.findOne(id);
  }

  @Roles('admin', 'editor')
  @Put(':id')
  @ApiOkResponse({ description: 'The article has been successfully updated.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articleService.update(id, updateArticleDto);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.articleService.remove(id);
  }
}
