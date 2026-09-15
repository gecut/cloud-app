import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from "class-validator";
import { normalizePhoneNumber, toEnglishDigits } from "../../../../common/utils/phone.util";

export class VerifyOtpDto {
  @ApiProperty({ example: "09121112233", description: "شماره موبایل کاربر" })
  @Transform(({ value }) => (value ? normalizePhoneNumber(value) : value))
  @IsString()
  @IsNotEmpty({ message: "شماره موبایل الزامی است" })
  @Matches(/^09\d{9}$/, { message: "فرمت شماره موبایل نامعتبر است" })
  phone: string;

  @ApiProperty({ example: "1234", description: "کد تایید دریافتی" })
  @Transform(({ value }) => (value ? toEnglishDigits(value).trim() : value))
  @IsString()
  @IsNotEmpty({ message: "کد تایید الزامی است" })
  @Length(4, 6, { message: "کد تایید باید بین ۴ تا ۶ رقم باشد" })
  code: string;

  @ApiPropertyOptional({ example: "علی محمدی", description: "نام کاربر در صورت ثبت‌نام جدید" })
  @IsString()
  @IsOptional()
  name?: string;
}
