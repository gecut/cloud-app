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

  @ApiProperty({ description: "Item title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Item description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Quantity" })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: "Unit Price in Toman (integer)" })
  @IsInt()
  @Min(0)
  unitPriceToman: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: "Customer ID" })
  @IsString()
  @IsNotEmpty()
  customerId: string;

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
