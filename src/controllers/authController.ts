import { Request, Response } from "express";
import { UserModel } from "../models/User";
import {
  comparePassword,
  generateToken,
  validateEmail,
  validatePassword,
  asyncHandler,
} from "../utils/helpers";
import { ApiResponse, JWTPayload } from "../types";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Username, email, and password are required",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters with uppercase, lowercase, and number",
    });
  }

  // Check if user already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email already registered",
    });
  }

  const existingUsername = await UserModel.findByUsername(username);
  if (existingUsername) {
    return res.status(409).json({
      success: false,
      message: "Username already taken",
    });
  }

  // Create user
  const user = await UserModel.create({
    username,
    email,
    password,
    role: role || "user",
  });

  // Generate token
  const tokenPayload: JWTPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  const token = generateToken(tokenPayload);

  const response: ApiResponse = {
    success: true,
    message: "User registered successfully",
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    },
  };

  res.status(201).json(response);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  // Find user
  const user = await UserModel.findByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  // Generate token
  const tokenPayload: JWTPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  const token = generateToken(tokenPayload);

  const response: ApiResponse = {
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    },
  };

  res.json(response);
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  const response: ApiResponse = {
    success: true,
    message: "Profile retrieved successfully",
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };

  res.json(response);
});

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { username, email } = req.body;

    const updateData: any = {};

    if (username) {
      const existingUsername = await UserModel.usernameExists(username, userId);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: "Username already taken",
        });
      }
      updateData.username = username;
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      const existingEmail = await UserModel.emailExists(email, userId);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }
      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const updatedUser = await UserModel.update(userId, updateData);

    const response: ApiResponse = {
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        updated_at: updatedUser.updated_at,
      },
    };

    res.json(response);
  }
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters with uppercase, lowercase, and number",
      });
    }

    // Get user with password
    const user = await UserModel.findByEmail(req.user!.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    await UserModel.updatePassword(userId, newPassword);

    const response: ApiResponse = {
      success: true,
      message: "Password changed successfully",
    };

    res.json(response);
  }
);
