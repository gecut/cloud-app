import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class SendNotificationDto {
  @ApiProperty({ enum: ["SMS", "EMAIL"] })
  @IsEnum(["SMS", "EMAIL"])
  type: "SMS" | "EMAIL";

  @ApiProperty({ description: "Recipient phone number or email address" })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({ description: "Notification template name" })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiPropertyOptional({ description: "Template metadata/payload data" })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
