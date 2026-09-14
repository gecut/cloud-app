import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class SendOtpDto {
  @ApiProperty({ example: "09121112233", description: "شماره موبایل کاربر" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: "فرمت شماره موبایل نامعتبر است (مثال: 09121234567)" })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: "09121112233", description: "شماره موبایل کاربر" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: "فرمت شماره موبایل نامعتبر است" })
  phone: string;

  @ApiProperty({ example: "1234", description: "کد تایید پیامک‌شده" })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  code: string;

  @ApiProperty({ example: "علی محمدی", required: false, description: "نام کاربر در صورت ثبت‌نام اولیه" })
  @IsString()
  @IsOptional()
  name?: string;
}

export class LoginPasswordDto {
  @ApiProperty({ example: "09121112233", description: "شماره موبایل کاربر" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: "فرمت شماره موبایل نامعتبر است" })
  phone: string;

  @ApiProperty({ example: "12345678", description: "رمز عبور" })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterCustomerDto {
  @ApiProperty({ example: "شرکت چوبینو", description: "نام و نام خانوادگی یا نام تجاری" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "09121112233", description: "شماره موبایل" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: "فرمت شماره موبایل نامعتبر است" })
  phone: string;

  @ApiProperty({ example: "12345678", required: false, description: "رمز عبور دلخواه" })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: "چوبینو گستر ایرانیان", required: false, description: "نام شرکت یا سازمان" })
  @IsString()
  @IsOptional()
  company?: string;
}
