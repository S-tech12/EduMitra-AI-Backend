import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  // In-memory storage for V1 (Development/Prototyping)
  // Maps email to { otp: string, expiresAt: number }
  private otpStorage: Map<string, { otp: string; expiresAt: number }> =
    new Map();
  private verifiedEmails: Map<string, number> = new Map();

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
      this.verifiedEmails.set(email, Date.now() + 15 * 60 * 1000); // Allow signup for 15 mins
      return true;
    }

    return false;
  }

  isVerified(email: string): boolean {
    const expiresAt = this.verifiedEmails.get(email);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.verifiedEmails.delete(email);
      return false;
    }
    return true;
  }

  consumeVerification(email: string): void {
    this.verifiedEmails.delete(email);
  }
}
