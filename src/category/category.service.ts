import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { ArticleService } from '../article/article.service';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  private categories: Category[] = [];

  constructor(private readonly articleService: ArticleService) {}

  create(createCategoryDto: CreateCategoryDto): Category {
    const newCategory = new Category();

    Object.assign(newCategory, {
      id: randomUUID(),
      ...createCategoryDto,
    });
    this.categories.push(newCategory);
    return newCategory;
  }

  findAll() {
    return this.categories;
  }

  findOne(id: string) {
    const category = this.categories.find((c) => c.id === id);
    if (!category) throw new NotFoundException();
    return category;
  }

  update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return category;
  }

  remove(id: string) {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException();

    this.articleService.nullifyCategory(id);

    this.categories.splice(index, 1)[0];
  }
}
