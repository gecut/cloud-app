import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { normalizePhoneNumber } from "../../../../common/utils/phone.util";

export class CreateCustomerDto {
  @ApiProperty({ description: "Customer name / Company name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: "Display name" })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ description: "Company / Brand name" })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ description: "Phone number" })
  @Transform(({ value }) => (value ? normalizePhoneNumber(value) : value))
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: "Email address" })
  @IsEmail()
  @IsOptional()
  email?: string;
}
