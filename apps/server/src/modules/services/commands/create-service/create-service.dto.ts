import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateServiceDto {
    @ApiProperty({ description: "Customer ID" })
    @IsString()
    @IsNotEmpty()
    customerId: string;

  @ApiPropertyOptional({ description: "Service Group ID" })
  @IsString()
  @IsOptional()
  serviceGroupId?: string;

  @ApiProperty({ description: "Service Type ID" })
  @IsString()
  @IsNotEmpty()
  serviceTypeId: string;

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

  @ApiProperty({ description: "Price in Toman" })
  @IsInt()
  @Min(0)
  priceToman: number;

  @ApiProperty({ description: "Start Date (ISO string)" })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: "Renewal Date (ISO string)" })
  @IsDateString()
  renewalDate: string;
}
