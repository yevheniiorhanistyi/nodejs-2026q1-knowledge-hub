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
import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiCreatedResponse({ type: Category })
  create(@Body() createCategoryDto: CreateCategoryDto): Category {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOkResponse({ type: [Category] })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: Category })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.findOne(id);
  }

  @Put(':id')
  @ApiOkResponse({ type: Category })
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
