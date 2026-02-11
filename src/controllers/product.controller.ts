import { Response } from 'express';
import { AuthRequest, ProductQuery } from '../types';
import prisma from '../config/database';

// Create product (Admin/Seller)
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      comparePrice,
      costPrice,
      sku,
      barcode,
      stock,
      categoryId,
      brand,
      weight,
      dimensions,
      images,
      isFeatured,
    } = req.body;

    if (!name || !slug || !description || !price || !sku || !categoryId) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, slug, description, price, SKU, and category are required',
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        comparePrice,
        costPrice,
        sku,
        barcode,
        stock: stock || 0,
        categoryId,
        brand,
        weight,
        dimensions,
        images: images || [],
        isFeatured: isFeatured || false,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get all products (with filters and search)
export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      inStock,
      isFeatured,
    } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    // Build filters
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (inStock === 'true') where.stock = { gt: 0 };
    if (isFeatured === 'true') where.isFeatured = true;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          category: true,
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings
    const productsWithRatings = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
          : 0;

      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: product._count.reviews,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        products: productsWithRatings,
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
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get single product
export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        reviews: {
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
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Calculate average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    res.status(200).json({
      status: 'success',
      data: {
        product: {
          ...product,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: product.reviews.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update product (Admin/Seller)
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const updateData = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        variants: true,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete product (Admin)
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    await prisma.product.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get featured products
export const getFeaturedProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 8 } = req.query as any;

    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        stock: { gt: 0 },
      },
      take: Number(limit),
      include: {
        category: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const productsWithRatings = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
          : 0;

      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
      };
    });

    res.status(200).json({
      status: 'success',
      data: { products: productsWithRatings },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch featured products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
