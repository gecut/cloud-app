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
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../../infrastructure/database/prisma.service";


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
  async createCategory(
    @Body()
    body: {
      name: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    if (!body.name || !body.name.trim()) {
      throw new BadRequestException("نام دسته‌بندی الزامی است");
    }

    let slug = body.slug ? body.slug.trim().toLowerCase() : generateSlug(body.name);
    // Ensure slug uniqueness
    const existing = await this.prisma.serviceType.findFirst({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const created = await this.prisma.serviceType.create({
      data: {
        name: body.name.trim(),
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
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const target =
      (await this.prisma.serviceType.findUnique({ where: { id } })) ||
      (await this.prisma.serviceType.findFirst({ where: { slug: id } }));
    if (!target) {
      throw new BadRequestException("دسته‌بندی مورد نظر یافت نشد");
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
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

    const servicesCount = target._count?.services || 0;
    if (servicesCount > 0) {
      throw new BadRequestException(
        `امکان حذف این دسته‌بندی وجود ندارد؛ در حال حاضر ${servicesCount} سرویس به آن متصل هستند. لطفاً ابتدا سرویس‌ها را انتقال دهید یا این دسته‌بندی را غیرفعال کنید.`,
      );
    }

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
