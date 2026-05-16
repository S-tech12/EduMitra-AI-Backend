import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  // In-memory storage for V1 (Development/Prototyping)
  // Maps email to { otp: string, expiresAt: number }
  private otpStorage: Map<string, { otp: string; expiresAt: number }> =
    new Map();

  storeOtp(email: string, otp: string, expiresInMinutes: number = 10): void {
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
    this.otpStorage.set(email, { otp, expiresAt });
  }

  verifyOtp(email: string, otp: string): boolean {
    const record = this.otpStorage.get(email);

    if (!record) {
      return false;
    }

    if (Date.now() > record.expiresAt) {
      this.otpStorage.delete(email); // Clean up expired OTP
      return false;
    }

    if (record.otp === otp) {
      this.otpStorage.delete(email); // Clean up used OTP
      return true;
    }

    return false;
  }
}
