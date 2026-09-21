import { Router } from 'express';
import authRouter from './auth.routes';
import scoresRouter from './scores.routes';
import charitiesRouter from './charities.routes';
import drawsRouter from './draws.routes';
import paymentsRouter from './payments.routes';
import winnersRouter from './winners.routes';
import adminRouter from './admin.routes';

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/scores', scoresRouter);
v1Router.use('/charities', charitiesRouter);
v1Router.use('/draws', drawsRouter);
v1Router.use('/payments', paymentsRouter);
v1Router.use('/winners', winnersRouter);
v1Router.use('/admin', adminRouter);

export default v1Router;
