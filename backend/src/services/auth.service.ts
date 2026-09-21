import bcrypt from 'bcryptjs';
import { userRepository, UserRow } from '../repositories';
import { generateToken } from '../utils/helpers/auth.helper';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors/app.error';
import logger from '../config/logger.config';

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  full_name: string;
  role: 'user' | 'admin';
  subscriptionStatus: string;
  subscription_status: string;
  subscriptionPlan: string | null;
  subscription_plan: string | null;
  selectedCharityId: string | null;
  selected_charity_id: string | null;
  charityContributionPercent: number;
  charity_contribution_percent: number;
  onboardingCompleted: boolean;
  onboarding_completed: boolean;
  createdAt: string;
  created_at: string;
}

export class AuthService {
  formatUser(user: UserRow): UserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      full_name: user.full_name,
      role: user.role,
      subscriptionStatus: user.subscription_status,
      subscription_status: user.subscription_status,
      subscriptionPlan: user.subscription_plan,
      subscription_plan: user.subscription_plan,
      selectedCharityId: user.selected_charity_id,
      selected_charity_id: user.selected_charity_id,
      charityContributionPercent: user.charity_contribution_percent,
      charity_contribution_percent: user.charity_contribution_percent,
      onboardingCompleted: Boolean(user.onboarding_completed),
      onboarding_completed: Boolean(user.onboarding_completed),
      createdAt: user.created_at,
      created_at: user.created_at,
    };
  }

  async register(data: { email: string; password: string; fullName: string }): Promise<{ user: UserResponse; token: string }> {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`User registered: ${user.email}`);

    return {
      user: this.formatUser(user),
      token,
    };
  }

  async login(data: { email: string; password: string }): Promise<{ user: UserResponse; token: string }> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      user: this.formatUser(user),
      token,
    };
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.formatUser(user);
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; email?: string; currentPassword?: string; newPassword?: string }
  ): Promise<UserResponse> {
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new BadRequestError('Current password is required');
      }
      const currentUser = await userRepository.findById(userId);
      if (!currentUser) {
        throw new NotFoundError('User not found');
      }
      const valid = await bcrypt.compare(data.currentPassword, currentUser.password_hash);
      if (!valid) {
        throw new BadRequestError('Current password is incorrect');
      }
    }

    if (data.email) {
      const existing = await userRepository.findByEmailExcludingId(data.email, userId);
      if (existing) {
        throw new ConflictError('Email already in use');
      }
    }

    const passwordHash = data.newPassword ? await bcrypt.hash(data.newPassword, 10) : null;
    const updated = await userRepository.updateProfile(userId, {
      fullName: data.fullName || null,
      email: data.email || null,
      passwordHash,
    });

    if (!updated) {
      throw new NotFoundError('User not found');
    }

    logger.info(`Profile updated for user: ${updated.email}`);
    return this.formatUser(updated);
  }
}

export const authService = new AuthService();
