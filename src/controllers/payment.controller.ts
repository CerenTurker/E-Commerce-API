import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Create payment intent (Mock Stripe)
export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        status: 'error',
        message: 'Order ID is required',
      });
    }

    // Get order
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({
        status: 'error',
        message: 'Order already paid',
      });
    }

    // Mock Stripe Payment Intent
    const paymentIntent = {
      id: `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      amount: Math.round(Number(order.total) * 100), // Convert to cents
      currency: 'usd',
      status: 'requires_payment_method',
      client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      created: Math.floor(Date.now() / 1000),
    };

    // Save payment intent ID to order
    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentId: paymentIntent.id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment intent created',
      data: { paymentIntent },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment intent',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Confirm payment (Mock Stripe)
export const confirmPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment intent ID is required',
      });
    }

    // Find order by payment intent ID
    const order = await prisma.order.findFirst({
      where: {
        stripePaymentId: paymentIntentId,
        userId,
      },
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    // Mock payment success/failure (90% success rate)
    const isSuccessful = Math.random() > 0.1;

    if (isSuccessful) {
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Payment successful',
        data: {
          paymentIntent: {
            id: paymentIntentId,
            status: 'succeeded',
            amount: Math.round(Number(order.total) * 100),
            currency: 'usd',
          },
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
          },
        },
      });
    } else {
      // Payment failed
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED' },
      });

      res.status(400).json({
        status: 'error',
        message: 'Payment failed',
        data: {
          paymentIntent: {
            id: paymentIntentId,
            status: 'failed',
            error: 'Card declined',
          },
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to process payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params as { orderId: string };

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        stripePaymentId: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get payment status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Refund payment (Mock)
export const refundPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can refund payments',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    if (order.paymentStatus !== 'PAID') {
      return res.status(400).json({
        status: 'error',
        message: 'Order is not paid',
      });
    }

    // Update order with transaction
    await prisma.$transaction(async (tx) => {
      // Restore stock
      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED',
        },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment refunded successfully',
      data: {
        refund: {
          id: `re_mock_${Date.now()}`,
          amount: Math.round(Number(order.total) * 100),
          currency: 'usd',
          status: 'succeeded',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to refund payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
