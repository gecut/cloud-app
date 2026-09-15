import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ description: "رمز عبور فعلی" })
  @IsString()
  @IsNotEmpty({ message: "رمز عبور فعلی الزامی است" })
  oldPassword: string;

  @ApiProperty({ description: "رمز عبور جدید" })
  @IsString()
  @IsNotEmpty({ message: "رمز عبور جدید الزامی است" })
  @MinLength(6, { message: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد" })
  newPassword: string;
}
