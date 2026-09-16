import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateServiceDto {
  @ApiPropertyOptional({ description: "Customer ID" })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: "Parent Catalog Service ID" })
  @IsString()
  @IsOptional()
  parentServiceId?: string;

  @ApiPropertyOptional({ description: "Service Group ID" })
  @IsString()
  @IsOptional()
  serviceGroupId?: string;

  @ApiPropertyOptional({ description: "Service Type ID" })
  @IsString()
  @IsOptional()
  serviceTypeId?: string;

  @ApiPropertyOptional({ description: "Service Type Slug (e.g. domain, hosting, server, api, package)" })
  @IsString()
  @IsOptional()
  serviceTypeSlug?: string;

  @ApiPropertyOptional({ description: "Server ID" })
  @IsString()
  @IsOptional()
  serverId?: string;

  @ApiProperty({ description: "Service Name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Price in Toman" })
  @IsInt()
  @IsOptional()
  @Min(0)
  priceToman?: number;

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

  @ApiPropertyOptional({ description: "Tracking Type (TIME, QUANTITY, HYBRID)" })
  @IsString()
  @IsOptional()
  trackingType?: string;

  @ApiPropertyOptional({ description: "Purchase Date (ISO string)" })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: "Start Date (ISO string)" })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: "Renewal Date (ISO string)" })
  @IsDateString()
  @IsOptional()
  renewalDate?: string;
}
