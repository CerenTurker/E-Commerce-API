import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Get or create wishlist
export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                reviews: {
                  select: {
                    rating: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: userId! },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  reviews: {
                    select: {
                      rating: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Calculate average ratings
    const itemsWithRatings = wishlist.items.map((item) => {
      const avgRating =
        item.product.reviews.length > 0
          ? item.product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            item.product.reviews.length
          : 0;

      return {
        ...item,
        product: {
          ...item.product,
          averageRating: Math.round(avgRating * 10) / 10,
        },
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        wishlist: {
          ...wishlist,
          items: itemsWithRatings,
        },
        itemCount: wishlist.items.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wishlist',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Add item to wishlist
export const addToWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID is required',
      });
    }

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Get or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: userId! },
      });
    }

    // Check if already in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });

    if (existingItem) {
      return res.status(400).json({
        status: 'error',
        message: 'Product already in wishlist',
      });
    }

    // Add to wishlist
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Product added to wishlist',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to add to wishlist',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.params as { itemId: string };

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: { wishlist: true },
    });

    if (!wishlistItem || wishlistItem.wishlist.userId !== userId) {
      return res.status(404).json({
        status: 'error',
        message: 'Wishlist item not found',
      });
    }

    await prisma.wishlistItem.delete({
      where: { id: itemId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Item removed from wishlist',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove from wishlist',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Clear wishlist
export const clearWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: 'Wishlist not found',
      });
    }

    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Wishlist cleared',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear wishlist',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
