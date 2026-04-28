import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The category has been successfully created.',
  })
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Returns a list of categories.' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Returns the requested category.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @ApiOkResponse({ description: 'The category has been successfully updated.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.remove(id);
  }
}
