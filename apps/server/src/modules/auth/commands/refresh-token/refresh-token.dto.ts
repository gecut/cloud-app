import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({ description: "Refresh Token دریافتی هنگام لاگین" })
  @IsString()
  @IsNotEmpty({ message: "Refresh Token الزامی است" })
  refreshToken: string;
}
