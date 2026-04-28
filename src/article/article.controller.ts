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
import { Article } from './entities/article.entity';
import { ArticleStatus } from './article.types';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('Article')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @ApiCreatedResponse({ type: Article })
  create(@Body() createArticleDto: CreateArticleDto): Article {
    return this.articleService.create(createArticleDto);
  }

  @Get()
  @ApiOkResponse({ type: [Article] })
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

  @Get(':id')
  @ApiOkResponse({ type: Article })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.articleService.findOne(id);
  }

  @Put(':id')
  @ApiOkResponse({ type: Article })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articleService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.articleService.remove(id);
  }
}
