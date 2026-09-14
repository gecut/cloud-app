import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateServerDto {
  @ApiProperty({ description: "Server name / hostname" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Provider name (e.g. Hetzner, Arvan, DigitalOcean)" })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "MAINTENANCE", "SUSPENDED", "INACTIVE"] })
  @IsEnum(["ACTIVE", "MAINTENANCE", "SUSPENDED", "INACTIVE"])
  @IsOptional()
  status?: "ACTIVE" | "MAINTENANCE" | "SUSPENDED" | "INACTIVE";

  @ApiPropertyOptional({ description: "IP Address" })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: "Domain name" })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiPropertyOptional({ description: "Location / Datacenter" })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: "CPU configuration" })
  @IsString()
  @IsOptional()
  cpu?: string;

  @ApiPropertyOptional({ description: "RAM configuration" })
  @IsString()
  @IsOptional()
  ram?: string;

  @ApiPropertyOptional({ description: "Storage configuration" })
  @IsString()
  @IsOptional()
  storage?: string;

  @ApiPropertyOptional({ description: "Monthly cost in Toman (integer)" })
  @IsInt()
  @Min(0)
  @IsOptional()
  monthlyCostToman?: number;

  @ApiPropertyOptional({ description: "Internal notes" })
  @IsString()
  @IsOptional()
  internalNotes?: string;
}
