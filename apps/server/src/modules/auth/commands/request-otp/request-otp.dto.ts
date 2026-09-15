import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches } from "class-validator";
import { normalizePhoneNumber } from "../../../../common/utils/phone.util";

export class RequestOtpDto {
  @ApiProperty({ example: "09121112233", description: "شماره موبایل کاربر" })
  @Transform(({ value }) => (value ? normalizePhoneNumber(value) : value))
  @IsString()
  @IsNotEmpty({ message: "شماره موبایل الزامی است" })
  @Matches(/^09\d{9}$/, { message: "فرمت شماره موبایل نامعتبر است (مثال: 09121112233)" })
  phone: string;
}
