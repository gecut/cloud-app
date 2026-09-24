import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../../infrastructure/database/prisma.service";

export class CreateCategoryDto {
  @ApiProperty({ description: "Category name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: "Category slug" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: "Category description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Category active flag" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Sort order" })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: "Category name" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "Category slug" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: "Category description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Category active flag" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Sort order" })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

function generateSlug(name: string): string {
  const englishOnly = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (englishOnly && englishOnly.length >= 2) {
    return englishOnly;
  }
  const lower = name.trim().toLowerCase();
  if (lower.includes("هاست") || lower.includes("میزبانی")) return `hosting-${Date.now().toString(36)}`;
  if (lower.includes("سرور") || lower.includes("vps")) return `server-${Date.now().toString(36)}`;
  if (lower.includes("دامنه") || lower.includes("دومین")) return `domain-${Date.now().toString(36)}`;
  if (lower.includes("api") || lower.includes("وب‌سرویس") || lower.includes("هوش")) return `api-${Date.now().toString(36)}`;
  if (lower.includes("پکیج") || lower.includes("بسته") || lower.includes("اشتراک")) return `package-${Date.now().toString(36)}`;
  if (lower.includes("ابر") || lower.includes("کلود")) return `cloud-${Date.now().toString(36)}`;
  if (lower.includes("امنیت")) return `security-${Date.now().toString(36)}`;
  if (lower.includes("پشتیبانی")) return `support-${Date.now().toString(36)}`;
  if (lower.includes("دیتابیس") || lower.includes("پایگاه")) return `db-${Date.now().toString(36)}`;
  if (lower.includes("متفرقه") || lower.includes("سایر")) return `misc-${Date.now().toString(36)}`;

  return `cat-${Date.now().toString(36)}`;
}

@ApiTags("categories")
@Controller("categories")
@UseGuards(RolesGuard)
export class CategoriesController {
  constructor(protected readonly prisma: PrismaService) {}

  @Get()
  @Roles("ADMIN", "CUSTOMER")
  @ApiOperation({ summary: "List all service categories / types" })
  async listCategories() {
    let items = await this.prisma.serviceType.findMany({
      include: {
        _count: {
          select: { services: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return {
      items: items.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        servicesCount: cat._count?.services || 0,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      })),
      total: items.length,
    };
  }

  @Post()
  @Roles("ADMIN")
  @ApiOperation({ summary: "Create a new service category" })
  async createCategory(@Body() body: CreateCategoryDto) {
    if (!body.name || !body.name.trim()) {
      throw new BadRequestException("نام دسته‌بندی الزامی است");
    }

    const cleanName = body.name.trim();
    const existingName = await this.prisma.serviceType.findFirst({
      where: { name: cleanName },
    });
    if (existingName) {
      throw new BadRequestException("دسته‌بندی با این نام قبلاً ایجاد شده است");
    }

    let rawSlug = body.slug?.trim() || "";
    let slug = rawSlug
      ? rawSlug.toLowerCase().replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "")
      : generateSlug(body.name);

    // Ensure slug uniqueness
    const existing = await this.prisma.serviceType.findFirst({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const created = await this.prisma.serviceType.create({
      data: {
        name: cleanName,
        slug,
        description: body.description?.trim() || null,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ? Number(body.sortOrder) : null,
      },
    });

    return created;
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update category details" })
  async updateCategory(
    @Param("id") id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    const target =
      (await this.prisma.serviceType.findUnique({ where: { id } })) ||
      (await this.prisma.serviceType.findFirst({ where: { slug: id } }));
    if (!target) {
      throw new BadRequestException("دسته‌بندی مورد نظر یافت نشد");
    }

    const updateData: any = {};
    if (body.name !== undefined) {
      const cleanName = body.name.trim();
      const existingName = await this.prisma.serviceType.findFirst({
        where: { name: cleanName, id: { not: target.id } },
      });
      if (existingName) {
        throw new BadRequestException("دسته‌بندی دیگری با این نام قبلاً ایجاد شده است");
      }
      updateData.name = cleanName;
    }
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder) || null;

    if (body.slug && body.slug.trim() !== target.slug) {
      const slugCandidate = body.slug.trim().toLowerCase();
      const existing = await this.prisma.serviceType.findFirst({
        where: { slug: slugCandidate, id: { not: target.id } },
      });
      if (existing) {
        throw new BadRequestException("این شناسه انگلیسی (اسلاگ) قبلاً استفاده شده است");
      }
      updateData.slug = slugCandidate;
    }

    const updated = await this.prisma.serviceType.update({
      where: { id: target.id },
      data: updateData,
    });

    return updated;
  }

  @Delete(":id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete a category" })
  async deleteCategory(@Param("id") id: string) {
    const target =
      (await this.prisma.serviceType.findUnique({
        where: { id },
        include: { _count: { select: { services: true } } },
      })) ||
      (await this.prisma.serviceType.findFirst({
        where: { slug: id },
        include: { _count: { select: { services: true } } },
      }));

    if (!target) {
      throw new BadRequestException("دسته‌بندی مورد نظر یافت نشد");
    }

    // Find any existing category to reassign services to
    let fallbackType = await this.prisma.serviceType.findFirst({
      where: { id: { not: target.id } },
    });

    // If no other category exists, create a default "other" fallback category with safe slug
    if (!fallbackType) {
      const fallbackSlug = target.slug === "other" ? `other-${Date.now().toString(36)}` : "other";
      fallbackType = await this.prisma.serviceType.create({
        data: {
          name: "سایر",
          slug: fallbackSlug,
          description: "دسته‌بندی عمومی و پیش‌فرض سیستم",
          isActive: true,
        },
      });
    }

    // Safely reassign services referencing this category to the fallback category
    await this.prisma.service.updateMany({
      where: { serviceTypeId: target.id },
      data: { serviceTypeId: fallbackType.id },
    }).catch(() => {});

    await this.prisma.service.updateMany({
      where: { serviceTypeId: target.slug },
      data: { serviceTypeId: fallbackType.id },
    }).catch(() => {});

    await this.prisma.serviceType.delete({ where: { id: target.id } });
    return { success: true, message: "دسته‌بندی با موفقیت حذف شد" };
  }
}

@ApiTags("service-types")
@Controller("service-types")
@UseGuards(RolesGuard)
export class ServiceTypesAliasController extends CategoriesController {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
