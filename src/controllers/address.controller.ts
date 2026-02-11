import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Create address
export const createAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    if (!fullName || !phone || !street || !city || !state || !zipCode || !country) {
      return res.status(400).json({
        status: 'error',
        message: 'All address fields are required',
      });
    }

    // If this is default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: userId!,
        fullName,
        phone,
        street,
        city,
        state,
        zipCode,
        country,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Address created successfully',
      data: { address },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create address',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get all user addresses
export const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({
      status: 'success',
      data: { addresses },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch addresses',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get single address
export const getAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    const address = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { address },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch address',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update address
export const updateAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };
    const updateData = req.body;

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existingAddress) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found',
      });
    }

    // If setting as default, unset others
    if (updateData.isDefault === true) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      status: 'success',
      message: 'Address updated successfully',
      data: { address },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update address',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete address
export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    const address = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found',
      });
    }

    await prisma.address.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Address deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete address',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
