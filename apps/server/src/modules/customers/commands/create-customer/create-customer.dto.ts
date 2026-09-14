import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCustomerDto {
  @ApiProperty({ description: "Customer name / Company name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: "Display name" })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: "Phone number" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: "Email address" })
  @IsEmail()
  @IsOptional()
  email?: string;
}
