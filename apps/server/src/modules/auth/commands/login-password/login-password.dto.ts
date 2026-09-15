import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class LoginPasswordDto {
  @ApiProperty({ example: "09121112233", description: "شماره موبایل کاربر" })
  @IsString()
  @IsNotEmpty({ message: "شماره موبایل الزامی است" })
  @Matches(/^09\d{9}$/, { message: "فرمت شماره موبایل نامعتبر است" })
  phone: string;

  @ApiProperty({ example: "12345678", description: "رمز عبور" })
  @IsString()
  @IsNotEmpty({ message: "رمز عبور الزامی است" })
  @MinLength(6, { message: "رمز عبور باید حداقل ۶ کاراکتر باشد" })
  password: string;
}
