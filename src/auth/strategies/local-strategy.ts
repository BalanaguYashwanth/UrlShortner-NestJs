import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { SigninDto } from '../auth.dto';

//Todo  - Remove safely
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }
  async validate(signinDto: SigninDto) {
    const user = await this.authService.signin(signinDto);
    if (!user) {
      throw new BadRequestException('Unauthorized please try again');
    }
    return user;
  }
}
