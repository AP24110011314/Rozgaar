import { authService } from '../services/auth.service.js';
import { verifyRefreshToken } from '../utils/crypto.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'refreshToken';

function setRefreshTokenCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/v1/auth',
  });
}

export class AuthController {
  async register(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.register(req.body);
      setRefreshTokenCookie(res, refreshToken);
      res.status(201).json({
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body);
      setRefreshTokenCookie(res, refreshToken);
      res.status(200).json({
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const incomingRefreshToken = req.cookies[COOKIE_NAME];
      const { user, accessToken, refreshToken } = await authService.refresh(incomingRefreshToken);
      setRefreshTokenCookie(res, refreshToken);
      res.status(200).json({
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      clearRefreshTokenCookie(res);
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      let userId = req.user?._id;
      const incomingRefreshToken = req.cookies[COOKIE_NAME];
      if (!userId && incomingRefreshToken) {
        try {
          const decoded = verifyRefreshToken(incomingRefreshToken);
          userId = decoded.userId;
        } catch {
          // Ignore invalid token on logout
        }
      }

      await authService.logout(userId);
      clearRefreshTokenCookie(res);
      res.status(200).json({
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const result = await authService.verifyEmail(req.body.token);
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.body);
      clearRefreshTokenCookie(res);
      res.status(200).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user._id);
      res.status(200).json({
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
