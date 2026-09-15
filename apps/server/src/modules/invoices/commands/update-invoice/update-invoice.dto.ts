import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { CreateInvoiceItemDto } from "../create-invoice/create-invoice.dto";

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: "Due Date (ISO string)" })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: "Notes" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: "Invoice status", enum: ["UNPAID", "PAID", "CANCELLED"] })
  @IsString()
  @IsOptional()
  status?: "UNPAID" | "PAID" | "CANCELLED";

  @ApiPropertyOptional({ type: [CreateInvoiceItemDto], description: "Invoice items" })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}
