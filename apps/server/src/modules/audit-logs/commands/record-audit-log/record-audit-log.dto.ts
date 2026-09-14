import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class RecordAuditLogDto {
  @ApiProperty({ enum: ["USER", "SYSTEM"] })
  @IsEnum(["USER", "SYSTEM"])
  actorType: "USER" | "SYSTEM";

  @ApiPropertyOptional({ description: "User ID of the actor" })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ enum: ["ADMIN", "CUSTOMER"] })
  @IsEnum(["ADMIN", "CUSTOMER"])
  @IsOptional()
  actorRole?: "ADMIN" | "CUSTOMER";

  @ApiPropertyOptional({ description: "Display name snapshot of actor" })
  @IsString()
  @IsOptional()
  actorDisplayNameSnapshot?: string;

  @ApiProperty({ description: "Action name (e.g. CREATE_CUSTOMER, PAY_INVOICE)" })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: "Entity type (e.g. Customer, Invoice, Service)" })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: "Entity ID" })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({ description: "Before state snapshot" })
  @IsObject()
  @IsOptional()
  before?: Record<string, any>;

  @ApiPropertyOptional({ description: "After state snapshot" })
  @IsObject()
  @IsOptional()
  after?: Record<string, any>;

  @ApiPropertyOptional({ description: "Reason for action" })
  @IsString()
  @IsOptional()
  reason?: string;
}
