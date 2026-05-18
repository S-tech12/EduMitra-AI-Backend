import { Controller, Get, Patch, Body, UseGuards, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PasswordHelper } from '../../utils/password.helper';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return {
      success: true,
      data: { user: userResponse },
    };
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.usersService.updateProfile(req.user.userId, updateProfileDto);
    
    if (!updatedUser) {
      throw new BadRequestException('Failed to update profile');
    }

    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    return {
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse },
    };
  }

  @Patch('update-password')
  async updatePassword(@Req() req: any, @Body() updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = updatePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.findById(req.user.userId);
    if (!user || !user.password) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await PasswordHelper.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }

    const hashedPassword = await PasswordHelper.hashPassword(newPassword);
    await this.usersService.updatePassword(user._id, hashedPassword);

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }
}
