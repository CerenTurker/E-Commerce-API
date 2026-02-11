import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Create review
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { productId, rating, title, comment, images } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID, rating, and comment are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: userId!,
          productId,
        },
      },
    });

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this product',
      });
    }

    // Check if user purchased this product (verified purchase)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: userId!,
          status: 'DELIVERED',
        },
      },
    });

    const review = await prisma.review.create({
      data: {
        userId: userId!,
        productId,
        rating,
        title,
        comment,
        images: images || [],
        isVerified: !!hasPurchased,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Review created successfully',
      data: { review },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create review',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get product reviews
export const getProductReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params as { productId: string };
    const { page = 1, limit = 10, rating } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { productId };
    if (rating) where.rating = Number(rating);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ]);

    // Calculate rating breakdown
    const ratingCounts = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true },
    });

    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingCounts.forEach((item) => {
      ratingBreakdown[item.rating as keyof typeof ratingBreakdown] = item._count.rating;
    });

    // Calculate average rating
    const avgRatingResult = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        stats: {
          averageRating: avgRatingResult._avg.rating
            ? Math.round(avgRatingResult._avg.rating * 10) / 10
            : 0,
          totalReviews: total,
          ratingBreakdown,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reviews',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get user's reviews
export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        skip,
        take: Number(limit),
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reviews',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update review
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };
    const { rating, title, comment, images } = req.body;

    const existingReview = await prisma.review.findFirst({
      where: { id, userId },
    });

    if (!existingReview) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found',
      });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(rating && { rating }),
        ...(title !== undefined && { title }),
        ...(comment && { comment }),
        ...(images !== undefined && { images }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Review updated successfully',
      data: { review },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update review',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete review
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params as { id: string };

    const review = await prisma.review.findFirst({
      where: { id, userId },
    });

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found',
      });
    }

    await prisma.review.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete review',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
