import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from './auth.dto';
import { User } from './user.entity';

/**
 * Demo login: a real app sends a one-time code by SMS and checks its hash.
 * This demo accepts the fixed code 000000 so it runs without an SMS provider.
 */
const DEMO_CODE = '000000';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string; user_id: string }> {
    if (dto.code !== DEMO_CODE) throw new UnauthorizedException('Wrong code');

    // insert-or-ignore: two first logins at the same moment still create one user
    await this.users.createQueryBuilder().insert().values({ phone: dto.phone }).orIgnore().execute();
    const user = await this.users.findOneByOrFail({ phone: dto.phone });

    const access_token = await this.jwt.signAsync({ sub: user.id }); // no phone number in the token
    return { access_token, user_id: user.id };
  }
}
