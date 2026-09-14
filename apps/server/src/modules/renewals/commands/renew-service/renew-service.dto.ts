import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class RenewServiceDto {
  @ApiProperty({ description: "Service ID to renew" })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: "New renewal date (ISO string)" })
  @IsDateString()
  newRenewalDate: string;

  @ApiPropertyOptional({ description: "Number of months to extend", default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  months?: number;
}
