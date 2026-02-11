import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Get or create cart
export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: userId! },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    res.status(200).json({
      status: 'success',
      data: {
        cart,
        summary: {
          itemCount: cart.items.length,
          totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: subtotal.toFixed(2),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cart',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Add item to cart
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID and valid quantity are required',
      });
    }

    // Check product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        status: 'error',
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: userId! },
      });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return res.status(400).json({
          status: 'error',
          message: `Only ${product.stock} items available in stock`,
        });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Item added to cart',
      data: { cart: updatedCart },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to add item to cart',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.params as { itemId: string };
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid quantity is required',
      });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart item not found',
      });
    }

    if (cartItem.product.stock < quantity) {
      return res.status(400).json({
        status: 'error',
        message: `Only ${cartItem.product.stock} items available`,
      });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    res.status(200).json({
      status: 'success',
      message: 'Cart item updated',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update cart item',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { itemId } = req.params as { itemId: string };

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart item not found',
      });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove item',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Clear cart
export const clearCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Cart not found',
      });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cart',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
