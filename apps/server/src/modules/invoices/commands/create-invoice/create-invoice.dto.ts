import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateInvoiceItemDto {
  @ApiPropertyOptional({ description: "Optional Service ID" })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: "Service Category / Type Snapshot" })
  @IsString()
  @IsOptional()
  serviceTypeSnapshot?: string;

  @ApiProperty({ description: "Item title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Item description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Quantity" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: "Unit Price in Toman (integer)" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  unitPriceToman?: number;

  @ApiPropertyOptional({ description: "Amount in Toman (alias for unitPriceToman)" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  amountToman?: number;

  @ApiPropertyOptional({ description: "Total in Toman" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  totalToman?: number;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ description: "Customer ID (optional, auto-filled from session if customer)" })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: "Supplier ID (if invoice is from/for a supplier)" })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ enum: ["CUSTOMER", "SUPPLIER"], description: "Counterparty type" })
  @IsString()
  @IsOptional()
  counterpartyType?: "CUSTOMER" | "SUPPLIER";

  @ApiProperty({ description: "Due Date (ISO string)" })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: "Notes" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto], description: "Invoice items" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
