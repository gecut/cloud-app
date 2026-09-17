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

  @ApiPropertyOptional({ description: "Birth date (ISO or Jalali formatted string)" })
  @IsString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ description: "Cooperation start date" })
  @IsString()
  @IsOptional()
  cooperationStartDate?: string;

  @ApiPropertyOptional({ description: "Telegram chat ID / Username" })
  @IsString()
  @IsOptional()
  telegramChatId?: string;

  @ApiPropertyOptional({ description: "Address" })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: "Description / Notes" })
  @IsString()
  @IsOptional()
  description?: string;
}
