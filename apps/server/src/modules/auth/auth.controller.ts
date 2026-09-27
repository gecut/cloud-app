import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { PasswordService } from "./services/password.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ChangePasswordCommand } from "./commands/change-password/change-password.command";
import { ChangePasswordDto } from "./commands/change-password/change-password.dto";
import { LoginPasswordCommand } from "./commands/login-password/login-password.command";
import { LoginPasswordDto } from "./commands/login-password/login-password.dto";
import { LogoutCommand } from "./commands/logout/logout.command";
import { RefreshTokenCommand } from "./commands/refresh-token/refresh-token.command";
import { RefreshTokenDto } from "./commands/refresh-token/refresh-token.dto";
import { RegisterCommand } from "./commands/register/register.command";
import { RegisterDto } from "./commands/register/register.dto";
import { RequestOtpCommand } from "./commands/request-otp/request-otp.command";
import { RequestOtpDto } from "./commands/request-otp/request-otp.dto";
import { RevokeSessionCommand } from "./commands/revoke-session/revoke-session.command";
import { VerifyOtpCommand } from "./commands/verify-otp/verify-otp.command";
import { VerifyOtpDto } from "./commands/verify-otp/verify-otp.dto";
import { Public } from "./decorators/public.decorator";
import { AuthGuard } from "./guards/auth.guard";
import { GetMeQuery } from "./queries/get-me/get-me.query";
import { AuthenticatedUser } from "./types/authenticated-user.type";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  @Public()
  @Get("setup-admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "راه‌اندازی فوری کاربر ادمین در دیتابیس" })
  async setupAdmin() {
    try {
      if (this.prisma.isDbConnected) {
        await (this.prisma as any).$executeRawUnsafe(`
          INSERT INTO "User" ("id", "name", "phone", "email", "role", "passwordHash", "tokenVersion", "createdAt", "updatedAt")
          VALUES 
            ('user_admin_primary', 'مدیر ارشد سامانه', '09363528608', 'admin@gecut-cloud.ir', 'ADMIN'::"Role", 'admin@Gecut-cloud', 0, NOW(), NOW()),
            ('user_admin_01', 'مدیر سامانه', '09120000001', 'admin@gecut.local', 'ADMIN'::"Role", 'Admin@123456', 0, NOW(), NOW())
          ON CONFLICT ("phone") 
          DO UPDATE SET 
            "role" = 'ADMIN'::"Role",
            "passwordHash" = EXCLUDED."passwordHash",
            "updatedAt" = NOW();
        `);
      } else {
        this.prisma.memUsers.set("user_admin_primary", {
          id: "user_admin_primary",
          name: "مدیر ارشد سامانه",
          phone: "09363528608",
          email: "admin@gecut-cloud.ir",
          passwordHash: "admin@Gecut-cloud",
          role: "ADMIN",
          tokenVersion: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        this.prisma.saveToDisk();
      }
      return {
        success: true,
        message: "کاربران ادمین با موفقیت ایجاد و فعال شدند",
        credentials: [
          { phone: "09363528608", password: "admin@Gecut-cloud" },
          { phone: "09120000001", password: "Admin@123456" },
        ],
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }

  @Public()
  @Post("otp/request")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "درخواست ارسال کد یکبار مصرف (OTP)" })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.commandBus.execute(new RequestOtpCommand(dto));
  }

  // Alias for backward compatibility
  @Public()
  @Post("send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ارسال کد یکبار مصرف پیامکی (سازگاری با کلاینت‌های قبل)" })
  async sendOtpAlias(@Body() dto: RequestOtpDto) {
    return this.commandBus.execute(new RequestOtpCommand(dto));
  }

  @Public()
  @Post("otp/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تایید کد OTP و ورود / ثبت‌نام خودکار" })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.commandBus.execute(new VerifyOtpCommand(dto));
  }

  // Alias for backward compatibility
  @Public()
  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تایید کد OTP (سازگاری با کلاینت‌های قبل)" })
  async verifyOtpAlias(@Body() dto: VerifyOtpDto) {
    return this.commandBus.execute(new VerifyOtpCommand(dto));
  }

  @Public()
  @Post("login/password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ورود با شماره موبایل و رمز عبور" })
  async loginPassword(@Body() dto: LoginPasswordDto) {
    return this.commandBus.execute(new LoginPasswordCommand(dto));
  }

  // Alias for backward compatibility
  @Public()
  @Post("login-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ورود با شماره موبایل و پسورد (سازگاری با کلاینت‌های قبل)" })
  async loginPasswordAlias(@Body() dto: LoginPasswordDto) {
    return this.commandBus.execute(new LoginPasswordCommand(dto));
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "ثبت‌نام مستقیم مشتری جدید" })
  async register(@Body() dto: RegisterDto) {
    return this.commandBus.execute(new RegisterCommand(dto));
  }

  @Public()
  @Post("refresh-token")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تمدید و صدور Access Token جدید با Refresh Token" })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.commandBus.execute(new RefreshTokenCommand(dto));
  }

  @Public()
  @Post("token/refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تمدید توکن (مسیر جایگزین)" })
  async tokenRefreshAlias(@Body() dto: RefreshTokenDto) {
    return this.commandBus.execute(new RefreshTokenCommand(dto));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "خروج از حساب کاربری" })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    return this.commandBus.execute(new LogoutCommand(user.id));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "تغییر رمز عبور کاربر و ابطال سایر نشست‌ها" })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.commandBus.execute(new ChangePasswordCommand(user.id, dto));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post("revoke-session")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ابطال تمامی نشست‌های فعال کاربر" })
  async revokeSession(@CurrentUser() user: AuthenticatedUser) {
    return this.commandBus.execute(new RevokeSessionCommand(user.id));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get("me")
  @ApiOperation({ summary: "دریافت مشخصات و نقش کاربر جاری احراز هویت شده" })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.queryBus.execute(new GetMeQuery(user.id));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get("admins")
  @ApiOperation({ summary: "دریافت لیست مدیران سامانه" })
  async listAdmins(@CurrentUser() user: AuthenticatedUser) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException("فقط مدیران سامانه مجاز به این عملیات هستند");
    }
    const users = await this.prisma.user.findMany({
      where: { role: "ADMIN" },
    });
    return (users || [])
      .filter((u: any) => u.role === "ADMIN")
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      }));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post("admins")
  @ApiOperation({ summary: "تعریف مدیر جدید در سامانه (فقط نقش ADMIN)" })
  async createAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name: string; phone: string; password: string },
  ) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException("فقط مدیران سامانه مجاز به ایجاد مدیر جدید هستند");
    }
    if (!body.name || !body.phone || !body.password) {
      throw new BadRequestException("نام، شماره تماس و رمز عبور الزامی است");
    }
    if (body.password.length < 6) {
      throw new BadRequestException("رمز عبور باید حداقل ۶ کاراکتر باشد");
    }

    const cleanPhone = body.phone.trim().replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
    const existing = await this.prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    const passwordHash = await this.passwordService.hash(body.password);

    if (existing) {
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          name: body.name.trim(),
          role: "ADMIN",
          passwordHash,
          tokenVersion: (existing.tokenVersion || 0) + 1,
        },
      });
      return {
        success: true,
        message: "کاربر موجود با موفقیت به عنوان مدیر ارتقا یافت",
        user: {
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          role: updated.role,
        },
      };
    }

    const created = await this.prisma.user.create({
      data: {
        name: body.name.trim(),
        phone: cleanPhone,
        role: "ADMIN",
        passwordHash,
      },
    });

    return {
      success: true,
      message: "مدیر جدید با موفقیت ایجاد شد",
      user: {
        id: created.id,
        name: created.name,
        phone: created.phone,
        role: created.role,
      },
    };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch("admins/:id")
  @ApiOperation({ summary: "ویرایش مشخصات مدیر (نام، شماره موبایل و رمز عبور)" })
  async updateAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { name?: string; phone?: string; newPassword?: string },
  ) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException("فقط مدیران سامانه مجاز به ویرایش اطلاعات مدیر هستند");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException("کاربر مدیر مورد نظر یافت نشد");
    }

    const updateData: any = {};
    if (body.name !== undefined && body.name.trim()) {
      updateData.name = body.name.trim();
    }

    if (body.phone !== undefined && body.phone.trim()) {
      const cleanPhone = body.phone.trim().replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
      const allUsers = await this.prisma.user.findMany();
      const conflict = allUsers.find(
        (u: any) => u.id !== id && u.phone === cleanPhone
      );
      if (conflict) {
        throw new BadRequestException("این شماره موبایل قبلاً برای کاربر دیگری ثبت شده است");
      }
      updateData.phone = cleanPhone;
    }

    if (body.newPassword !== undefined && body.newPassword.trim()) {
      if (body.newPassword.trim().length < 6) {
        throw new BadRequestException("رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
      }
      updateData.passwordHash = await this.passwordService.hash(body.newPassword.trim());
      updateData.tokenVersion = (targetUser.tokenVersion || 0) + 1;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: "مشخصات مدیر با موفقیت به‌روزرسانی شد",
      user: {
        id: updated?.id || id,
        name: updated?.name || updateData.name || targetUser.name,
        phone: updated?.phone || updateData.phone || targetUser.phone,
        role: updated?.role || targetUser.role,
      },
    };
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post("admins/:id")
  @ApiOperation({ summary: "ویرایش مشخصات مدیر (جایگزین POST)" })
  async updateAdminPost(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { name?: string; phone?: string; newPassword?: string },
  ) {
    return this.updateAdmin(user, id, body);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post("admins/change-password")
  @ApiOperation({ summary: "تغییر رمز عبور یا مشخصات مدیر (توسط مدیر سامانه)" })
  async changeAdminPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { userId?: string; newPassword?: string; name?: string; phone?: string },
  ) {
    if (user.role !== "ADMIN") {
      throw new ForbiddenException("فقط مدیران مجاز به تغییر مشخصات هستند");
    }

    const targetUserId = body.userId || user.id;
    return this.updateAdmin(user, targetUserId, {
      name: body.name,
      phone: body.phone,
      newPassword: body.newPassword,
    });
  }
}
