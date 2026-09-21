import { Router } from 'express';
import {
  createCheckoutSession,
  cancelSubscription,
  getPaymentStatus,
  confirmSubscription,
} from '../../controllers/payments.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validateRequestBody } from '../../validators/index';
import { createCheckoutSessionSchema } from '../../validators/payments.validator';

const router = Router();

router.post('/create-checkout-session', authMiddleware, validateRequestBody(createCheckoutSessionSchema), createCheckoutSession);
router.post('/cancel', authMiddleware, cancelSubscription);
router.post('/confirm', authMiddleware, confirmSubscription);
router.get('/status', authMiddleware, getPaymentStatus);

export default router;
