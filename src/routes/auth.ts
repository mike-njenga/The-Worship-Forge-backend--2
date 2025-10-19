import express, { Request, Response } from 'express';
import { generateToken, generateRefreshToken, authenticate } from '../middleware/auth';
import { validateUserRegistration, validateUserLogin } from '../middleware/validation';
import User from '../models/User';
import { ApiResponse, AuthRequest } from '../types';

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateUserRegistration, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role = 'student' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      } as ApiResponse);
    }

    // Create new user
    const user = new User({
      email,
      password,
      role,
      profile: {
        firstName,
        lastName
      }
    });

    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove password from response
    const userResponse = user.toJSON();
    const { password: _, ...userWithoutPassword } = userResponse;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateUserLogin, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      } as ApiResponse);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      } as ApiResponse);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Remove password from response
    const userResponse = user.toJSON();
    const { password: _, ...userWithoutPassword } = userResponse;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user }
    } as ApiResponse);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // In a stateless JWT implementation, logout is handled client-side
    // by removing the token from storage
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    } as ApiResponse);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

export default router;
