import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PaymentsService } from "./payments.service.js";
import { AppError } from "../../shared/errors.js";

export function registerPaymentsRoutes(app: FastifyInstance, paymentsService: PaymentsService) {
  const handleCreatePayment = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const user = (req as any).user;
    if (!user || !user.id) {
      return reply.status(401).send({
        error: "AUTH_REQUIRED",
        message: "You must be signed in to initialize payment.",
      });
    }

    try {
      const payment = typeof paymentsService.getPaymentOrder === "function"
        ? await paymentsService.getPaymentOrder(id, user)
        : await paymentsService.createPaymentOrder(id, user);
      return reply.status(200).send({
        success: true,
        payment,
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({
          error: err.code,
          message: err.message,
          details: err.details,
        });
      }
      throw err;
    }
  };

  const handleWebhook = async (req: FastifyRequest, reply: FastifyReply) => {
    const signature = String(
      req.headers["x-razorpay-signature"] ||
        req.headers["X-Razorpay-Signature"] ||
        ""
    );

    const rawBody = (req as any).rawBody || req.body;
    const bodyBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : Buffer.from(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody));

    try {
      const result = await paymentsService.handleWebhook(bodyBuffer, signature);
      return reply.status(200).send({
        success: true,
        ...result,
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({
          error: err.code,
          message: err.message,
        });
      }
      throw err;
    }
  };

  const handleVerifyPayment = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      };
    }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    const body = (req.body || {}) as any;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: "Missing razorpay_payment_id, razorpay_order_id, or razorpay_signature",
      });
    }

    const user = (req as any).user;
    if (!user || !user.id) {
      return reply.status(401).send({
        error: "AUTH_REQUIRED",
        message: "You must be signed in to verify payment.",
      });
    }

    try {
      const result = await paymentsService.verifyPayment({
        bookingId: id,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        user,
      });
      return reply.status(200).send({
        success: true,
        ...result,
      });
    } catch (err: any) {
      if (err instanceof AppError) {
        return reply.status(err.statusCode).send({
          error: err.code,
          message: err.message,
        });
      }
      throw err;
    }
  };

  const paymentOpts = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };
  const webhookOpts = { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } };

  app.post("/bookings/:id/payment", paymentOpts, handleCreatePayment);
  app.post("/api/v1/bookings/:id/payment", paymentOpts, handleCreatePayment);

  app.post("/bookings/:id/verify-payment", paymentOpts, handleVerifyPayment);
  app.post("/api/v1/bookings/:id/verify-payment", paymentOpts, handleVerifyPayment);

  app.post("/webhooks/payment", webhookOpts, handleWebhook);
  app.post("/api/v1/webhooks/payment", webhookOpts, handleWebhook);
  app.post("/webhooks/razorpay", webhookOpts, handleWebhook);
  app.post("/api/v1/webhooks/razorpay", webhookOpts, handleWebhook);
  app.post("/api/v1/payments/webhooks/razorpay", webhookOpts, handleWebhook);
  app.post("/api/v1/payments/webhooks/:provider", webhookOpts, handleWebhook);
}
