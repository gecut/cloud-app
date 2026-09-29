import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: "Service Name" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "SUSPENDED", "INACTIVE"] })
  @IsEnum(["ACTIVE", "SUSPENDED", "INACTIVE"])
  @IsOptional()
  status?: "ACTIVE" | "SUSPENDED" | "INACTIVE";

  @ApiPropertyOptional({ description: "Price in Toman" })
  @IsInt()
  @Min(0)
  @IsOptional()
  priceToman?: number;

  @ApiPropertyOptional({ description: "Purchase Date (ISO string)" })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: "Tracking Type (TIME, QUANTITY, HYBRID)" })
  @IsString()
  @IsOptional()
  trackingType?: string;

  @ApiPropertyOptional({ description: "Start Date (ISO string)" })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: "Renewal Date (ISO string or null)" })
  @IsOptional()
  renewalDate?: string | null;

  @ApiPropertyOptional({ description: "Server ID" })
  @IsString()
  @IsOptional()
  serverId?: string;

  @ApiPropertyOptional({ description: "Service Group ID" })
  @IsString()
  @IsOptional()
  serviceGroupId?: string;

  @ApiPropertyOptional({ description: "Customer ID" })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: "Parent Catalog Service ID" })
  @IsString()
  @IsOptional()
  parentServiceId?: string;

  @ApiPropertyOptional({ description: "Service Type ID" })
  @IsString()
  @IsOptional()
  serviceTypeId?: string;

  @ApiPropertyOptional({ description: "Service Type Slug (e.g. domain, hosting, server, etc.)" })
  @IsString()
  @IsOptional()
  serviceTypeSlug?: string;

  @ApiPropertyOptional({ description: "Billing Cycle (MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL)" })
  @IsString()
  @IsOptional()
  billingCycle?: string;

  @ApiPropertyOptional({ description: "Auto Renew flag" })
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({ description: "Package quantity" })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: "Consumed / used quantity" })
  @IsOptional()
  usedQuantity?: number;

  @ApiPropertyOptional({ enum: ["NONE", "BASIC", "DETAILED"] })
  @IsEnum(["NONE", "BASIC", "DETAILED"])
  @IsOptional()
  serverVisibilityLevel?: "NONE" | "BASIC" | "DETAILED";
}
