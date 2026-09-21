import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../../controllers/auth.controller';
import { validateRequestBody } from '../../validators/index';
import { registerSchema, loginSchema, updateProfileSchema } from '../../validators/auth.validator';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateRequestBody(registerSchema), register);
router.post('/login', validateRequestBody(loginSchema), login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, validateRequestBody(updateProfileSchema), updateProfile);

export default router;
