import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class ZibalPaymentRequestDto {
  @ApiProperty({ description: "Invoice ID to pay" })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiPropertyOptional({ description: "Custom callback URL (optional)" })
  @IsUrl({ require_tld: false })
  @IsOptional()
  callbackUrl?: string;

  @ApiPropertyOptional({ description: "Frontend return URL after payment completes (optional)" })
  @IsUrl({ require_tld: false })
  @IsOptional()
  returnUrl?: string;
}
