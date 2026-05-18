import { IsString, IsOptional, IsMobilePhone } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  @IsMobilePhone()
  mobile?: string;

  @IsString()
  @IsOptional()
  standard?: string;
}
