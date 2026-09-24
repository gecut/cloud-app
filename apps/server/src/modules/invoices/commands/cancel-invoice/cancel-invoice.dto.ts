import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CancelInvoiceDto {
  @ApiPropertyOptional({ description: "Cancellation reason" })
  @IsString()
  @IsOptional()
  reason?: string;
}
