import { Transform } from 'class-transformer';
import {
  Contains,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user.enum';

export class CreateUser {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  // Checks run bottom-up: required → contains @ → valid format
  @IsEmail({}, { message: 'Email must be valid, e.g. name@example.com' })
  @Contains('@', { message: 'Email must contain @' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsUUID('all', { message: 'franchiseId must be a valid UUID' })
  franchiseId?: string;

  @IsOptional()
  @IsString()
  employeeId?: number;
}
