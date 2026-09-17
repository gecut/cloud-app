import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: "شرکت چوبینو نوین" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "چوبینو گستر" })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ example: "شرکت چوبینو" })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ example: "09121112233" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "info@choobinooo.ir" })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "SUSPENDED", "INACTIVE"], example: "ACTIVE" })
  @IsEnum(["ACTIVE", "SUSPENDED", "INACTIVE"])
  @IsOptional()
  status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";

  @ApiPropertyOptional({ description: "Birth date (ISO string)", example: "1995-06-20T00:00:00.000Z" })
  @IsString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ description: "Cooperation start date (ISO string)", example: "2024-03-20T00:00:00.000Z" })
  @IsString()
  @IsOptional()
  cooperationStartDate?: string;

  @ApiPropertyOptional({ description: "Telegram chat ID or @username", example: "@ali_gecut" })
  @IsString()
  @IsOptional()
  telegramChatId?: string;

  @ApiPropertyOptional({ description: "Address", example: "تهران، میدان ونک، خیابان ملاصدرا، پلاک ۱۲" })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: "Description / Notes", example: "مشتری VIP هاستینگ ابری" })
  @IsString()
  @IsOptional()
  description?: string;
}
