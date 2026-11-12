import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { loginUser, logoutUser, meUser, registerUser } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logoutUser);
authRouter.get('/me', requireAuth, meUser);