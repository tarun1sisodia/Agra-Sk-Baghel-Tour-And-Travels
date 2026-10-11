import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PaymentsService } from "./payments.service.js";
import { AppError } from "../../shared/errors.js";

export function registerPaymentsRoutes(app: FastifyInstance, paymentsService: PaymentsService) {
  const handleCreatePayment = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id } = req.params;
    try {
      const payment = await paymentsService.createPaymentOrder(id);
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

  app.post("/bookings/:id/payment", handleCreatePayment);
  app.post("/api/v1/bookings/:id/payment", handleCreatePayment);

  app.post("/webhooks/payment", handleWebhook);
  app.post("/api/v1/webhooks/payment", handleWebhook);
  app.post("/webhooks/razorpay", handleWebhook);
  app.post("/api/v1/webhooks/razorpay", handleWebhook);
}
