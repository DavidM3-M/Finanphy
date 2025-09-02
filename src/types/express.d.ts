import type { UserEntity } from 'src/users/entities/user.entity';

declare namespace Express {
  export interface Request {
    user?: UserEntity;
  }
}