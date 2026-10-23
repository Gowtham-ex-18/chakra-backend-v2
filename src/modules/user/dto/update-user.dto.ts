import { PartialType } from '@nestjs/swagger';
import { CreateUser } from './create-user.dto';

// Same fields and rules as CreateUser, but every field is optional
export class UpdateUser extends PartialType(CreateUser) {}
