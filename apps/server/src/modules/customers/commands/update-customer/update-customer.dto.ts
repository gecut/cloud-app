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
}
