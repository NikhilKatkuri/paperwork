import { NextFunction, Request, Response } from 'express';
import statusCodes, { StatusCodes } from 'http-status-codes';
import AuthService from './auth.service';
import config from '@/config';
import { AppError } from '@/utils/AppError';
import jwt from 'jsonwebtoken';
import { CustomAuthRequest } from '@/types';

const authService = new AuthService();

const signInController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;
        const { accessToken, refreshToken } = await authService.signIn({
            email,
            password,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(statusCodes.OK).json({
            success: true,
            message: 'User signed in successfully',
            accessToken,
        });
    } catch (error) {
        next(error);
    }
};

const signUpController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email, password, fullName, avatarUrl = null, bio = '' } = req.body;
    try {
        const { accessToken, refreshToken } = await authService.signUp({
            email,
            password,
            fullName,
            avatarUrl,
            bio,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(statusCodes.CREATED).json({
            success: true,
            message: 'User registered successfully',
            accessToken,
        });
    } catch (error) {
        next(error);
    }
};

const signOutController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw AppError.Unauthorized('No refresh token provided');
        }
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'strict',
        });

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

const refreshTokenController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw AppError.Unauthorized('No refresh token provided');
        }
        let decode;
        try {
            decode = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as {
                userId: string;
                email: string;
            };
        } catch (jwterror) {
            throw AppError.Unauthorized('Invalid or expired refresh token');
        }

        if (!decode || !decode.userId || !decode.email) {
            throw AppError.Unauthorized('Invalid refresh token');
        }

        const { newAccessToken, newRefreshToken } =
            await authService.refreshTokenService({
                userId: decode.userId,
                email: decode.email,
            });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Token refreshed successfully',
            accessToken: newAccessToken,
        });
    } catch (error) {
        next(error);
    }
};

const getProfileController = async (
    req: CustomAuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw AppError.Unauthorized('User not authenticated');
        }
        const profile = await authService.getProfileService(userId);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: { profile },
        });
    } catch (error) {
        next(error);
    }
};

export {
    signInController,
    signUpController,
    refreshTokenController,
    signOutController,
    getProfileController,
};
