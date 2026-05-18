import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../../utils/mail.service';
import { OtpService } from '../../utils/otp.service';
import { OtpHelper } from '../../utils/otp.helper';
import { PasswordHelper } from '../../utils/password.helper';
import { SignupDto } from './dto/signup.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, VerifyForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private otpService: OtpService,
    private configService: ConfigService,
  ) { }

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { email } = sendOtpDto;

    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const otp = OtpHelper.generateOtp();
    this.otpService.storeOtp(email, otp);

    try {
      await this.mailService.sendOtpEmail(email, otp);
      return { success: true, message: 'OTP sent successfully to your email' };
    } catch (error) {
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;
    const isValid = this.otpService.verifyOtp(email, otp);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    return { success: true, message: 'OTP verified successfully' };
  }

  async signup(signupDto: SignupDto) {
    const { email, password, username } = signupDto;

    // Validate if OTP was verified for this email
    if (!this.otpService.isVerified(email)) {
      throw new BadRequestException('Email verification required');
    }

    // Check if username already exists
    const userByUsername = await this.usersService.findByUsernameOrEmail(username);
    if (userByUsername) {
      throw new BadRequestException('Username already taken');
    }

    // Hash password
    const hashedPassword = await PasswordHelper.hashPassword(password);

    // Create user
    const newUser = await this.usersService.create({
      ...signupDto,
      password: hashedPassword,
      isVerified: true,
    });

    // Clear verification state
    this.otpService.consumeVerification(email);

    // Generate JWT
    const payload = { sub: newUser._id, email: newUser.email, username: newUser.username };
    const token = this.jwtService.sign(payload);

    // Prepare response
    const user = newUser.toObject();
    delete user.password;

    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        access_token: token,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { usernameOrEmail, password } = loginDto;
    const user = await this.usersService.findByUsernameOrEmail(usernameOrEmail);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await PasswordHelper.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      username: user.username,
    };
    const token = this.jwtService.sign(payload);

    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        access_token: token,
      },
    };
  }

  async forgotPasswordSendOtp(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    const otp = OtpHelper.generateOtp();
    this.otpService.storeOtp(dto.email, otp);

    try {
      await this.mailService.sendOtpEmail(dto.email, otp);
      return { success: true, message: 'OTP sent to your email' };
    } catch (error) {
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }

  async forgotPasswordVerifyOtp(dto: VerifyForgotPasswordDto) {
    const isValid = this.otpService.verifyOtp(dto.email, dto.otp);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Generate a temporary reset token (valid for 15 minutes)
    const resetToken = this.jwtService.sign(
      { email: dto.email, type: 'password_reset' },
      { expiresIn: '15m' }
    );

    // Send the reset link
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    
    try {
      await this.mailService.sendResetPasswordEmail(dto.email, resetLink);
      return { 
        success: true, 
        message: 'OTP verified. A password reset link has been sent to your email.' 
      };
    } catch (error) {
      throw new BadRequestException('Failed to send reset link. Please try again.');
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(dto.token);
      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const hashedPassword = await PasswordHelper.hashPassword(dto.password);
      await this.usersService.updatePassword(user._id, hashedPassword);

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return userResponse;
  }
}
