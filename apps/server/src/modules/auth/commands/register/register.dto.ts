import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "علی محمدی", description: "نام و نام خانوادگی" })
  @IsString()
  @IsNotEmpty({ message: "نام و نام خانوادگی الزامی است" })
  name: string;

  @ApiProperty({ example: "09121112233", description: "شماره موبایل" })
  @IsString()
  @IsNotEmpty({ message: "شماره موبایل الزامی است" })
  @Matches(/^09\d{9}$/, { message: "فرمت شماره موبایل نامعتبر است (مثال: 09121234567)" })
  phone: string;

  @ApiProperty({ example: "12345678", description: "رمز عبور" })
  @IsString()
  @IsNotEmpty({ message: "رمز عبور الزامی است" })
  @MinLength(6, { message: "رمز عبور باید حداقل ۶ کاراکتر باشد" })
  password: string;

  @ApiPropertyOptional({ example: "1995-05-12", description: "تاریخ تولد" })
  @IsString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ example: "2024-01-01", description: "تاریخ شروع همکاری" })
  @IsString()
  @IsOptional()
  cooperationStartDate?: string;

  @ApiPropertyOptional({ example: "@user_id یا 12345678", description: "شناسه/ChatID تلگرام" })
  @IsString()
  @IsOptional()
  telegramChatId?: string;

  @ApiPropertyOptional({ example: "user@example.com", description: "ایمیل" })
  @IsEmail({}, { message: "فرمت ایمیل نامعتبر است" })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "شرکت پیشگام", description: "نام شرکت یا برند" })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ enum: ["ADMIN", "CUSTOMER"], example: "ADMIN", description: "نقش کاربر" })
  @IsString()
  @IsOptional()
  role?: "ADMIN" | "CUSTOMER";
}
