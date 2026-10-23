import { UserRole } from '../enums/user.enum';

export interface User {
  id: number;
  userId: string;
  franchiseId: string | null;
  employeeId: number | null;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
