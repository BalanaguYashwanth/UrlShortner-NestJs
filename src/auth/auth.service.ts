import { Injectable } from '@nestjs/common';
import { AuthProps } from './auth.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SigninDto, SignupDto } from './auth.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET || '1C77AnNXd@+2';
  constructor(
    @InjectModel('Auth')
    private readonly authModel: Model<AuthProps>,
  ) {}
  createUser = async (authDto: SignupDto) => {
    const { username, email, password } = authDto;

    if (password.length <= 6) {
      throw new Error(
        'Password length should be equal or greater than 6 characters',
      );
    }
    const hasUserDetails = await this.authModel.findOne({ email });
    if (hasUserDetails) {
      throw new Error('Email is already exists');
    }
    const hashPassword = await bcrypt.hash(password, 10);
    await this.authModel.create({
      username,
      email,
      password: hashPassword,
    });
  };

  signin = async (signinDto: SigninDto) => {
    const { email, password } = signinDto;
    const hasUserDetails = await this.authModel.findOne({ email });
    if (hasUserDetails) {
      const { id, username, password: userPassword } = hasUserDetails;
      const comparePassword = await bcrypt.compare(password, userPassword);
      if (comparePassword) {
        const accessToken = jwt.sign(
          {
            user: {
              id,
              username,
              email,
            },
          },
          this.ACCESS_TOKEN_SECRET,
        );
        return accessToken;
      } else {
        throw new Error('Login details are wrong, please try again');
      }
    } else {
      throw new Error('Email not found, please register');
    }
  };
}
