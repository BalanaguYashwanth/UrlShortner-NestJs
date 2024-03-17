import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { SigninDto, SignupDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() authDto: SignupDto) {
    try {
      await this.authService.createUser(authDto);
      return { data: 'user is successfully created' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('signin')
  async signin(@Body() signinDto: SigninDto) {
    try {
      const jwtToken = await this.authService.signin(signinDto);
      return { data: jwtToken };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
