import { User } from '../models/User.js';
import { ApplicantProfile } from '../models/ApplicantProfile.js';
import { Company } from '../models/Company.js';
import { AppError } from '../utils/appError.js';
import {
  hashToken,
  generateRandomToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/crypto.js';
import { mailService } from './mail.service.js';

export class AuthService {
  /**
   * Register a new user
   */
  async register({ name, email, password, role = 'applicant', privacyConsent, companyName }) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw AppError.conflict('An account with this email address already exists');
    }

    const passwordHash = await User.hashPassword(password);
    const verificationRaw = generateRandomToken(32);
    const emailVerificationToken = hashToken(verificationRaw);
    const emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const user = new User({
      name,
      email,
      passwordHash,
      role,
      privacyConsent,
      privacyConsentAt: new Date(),
      emailVerificationToken,
      emailVerificationExpires,
    });

    // If recruiter and companyName is provided, create Company
    if (role === 'recruiter' && companyName) {
      const baseSlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'company';
      const slug = `${baseSlug}-${generateRandomToken(4)}`;

      const company = await Company.create({
        name: companyName,
        slug,
        owner: user._id,
        members: [{ user: user._id, role: 'owner' }],
      });
      user.company = company._id;
    }

    // Generate tokens
    const accessToken = signAccessToken({ userId: user._id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id });
    user.refreshTokenHash = hashToken(refreshToken);

    await user.save();

    // If applicant, initialize ApplicantProfile
    if (role === 'applicant') {
      await ApplicantProfile.create({
        user: user._id,
      });
    }

    // Send verification email asynchronously
    mailService.sendVerificationEmail(user.email, user.name, verificationRaw);

    const safeUser = user.toJSON();
    return { user: safeUser, accessToken, refreshToken };
  }

  /**
   * Login user with credentials
   */
  async login({ email, password }) {
    const user = await User.findOne({ email })
      .select('+passwordHash +refreshTokenHash')
      .populate('company');

    if (!user || !user.isActive) {
      throw AppError.unauthenticated('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw AppError.unauthenticated('Invalid credentials');
    }

    // Generate new access token and refresh token
    const accessToken = signAccessToken({ userId: user._id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id });

    // Rotate refresh token
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    const safeUser = user.toJSON();
    return { user: safeUser, accessToken, refreshToken };
  }

  /**
   * Refresh access token with refresh rotation and reuse detection
   */
  async refresh(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      throw AppError.unauthenticated('Refresh token required');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(incomingRefreshToken);
    } catch {
      throw AppError.unauthenticated('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.userId)
      .select('+refreshTokenHash')
      .populate('company');

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw AppError.unauthenticated('Session expired or account deactivated');
    }

    const incomingHash = hashToken(incomingRefreshToken);

    // Reuse detection: If hash doesn't match current DB hash, token has been compromised or reused
    if (incomingHash !== user.refreshTokenHash) {
      user.refreshTokenHash = null; // Invalidate current session
      await user.save();
      throw AppError.unauthenticated('Session reuse detected. Access revoked.');
    }

    // Token is valid; rotate both tokens
    const accessToken = signAccessToken({ userId: user._id, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user._id });

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    const safeUser = user.toJSON();
    return { user: safeUser, accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout user and revoke active refresh session
   */
  async logout(userId) {
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    }
  }

  /**
   * Verify email via token
   */
  async verifyEmail(rawToken) {
    const hashed = hashToken(rawToken);
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw AppError.badRequest('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return { message: 'Email successfully verified' };
  }

  /**
   * Forgot password: dispatch reset token
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (user && user.isActive) {
      const resetRaw = generateRandomToken(32);
      user.passwordResetToken = hashToken(resetRaw);
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      mailService.sendPasswordResetEmail(user.email, user.name, resetRaw);
    }

    // Always return generic success to prevent email enumeration
    return { message: 'If an account exists with that email, a password reset link has been sent.' };
  }

  /**
   * Reset password with valid token
   */
  async resetPassword({ token, password }) {
    const hashed = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordHash +refreshTokenHash');

    if (!user) {
      throw AppError.badRequest('Invalid or expired reset token');
    }

    user.passwordHash = await User.hashPassword(password);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshTokenHash = null; // Invalidate any existing sessions
    await user.save();

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  /**
   * Get current authenticated user details
   */
  async getMe(userId) {
    const user = await User.findById(userId).populate('company');
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user.toJSON();
  }
}

export const authService = new AuthService();

