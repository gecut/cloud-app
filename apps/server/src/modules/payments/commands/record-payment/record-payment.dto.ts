import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class RecordPaymentDto {
  @ApiProperty({ description: "Invoice ID" })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ description: "Amount in Toman (integer)" })
  @IsInt()
  @Min(1)
  amountToman: number;

  @ApiProperty({ description: "Payment Gateway Provider (e.g. zibal, zarinpal, manual)" })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ description: "Gateway Reference ID / Transaction ID" })
  @IsString()
  @IsNotEmpty()
  gatewayRef: string;
}
