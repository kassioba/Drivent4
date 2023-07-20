import { Router } from 'express';
import { getUserBooking, postUserBooking, updateUserBooking } from '@/controllers/booking-controller';
import { authenticateToken, validateBody, validateParams } from '@/middlewares';
import { bookingParamsSchema, bookingSchema } from '@/schemas';

const bookingRouter = Router();

bookingRouter
  .all('/*', authenticateToken)
  .get('', getUserBooking)
  .post('', validateBody(bookingSchema), postUserBooking)
  .put('/:bookingId', validateBody(bookingSchema), validateParams(bookingParamsSchema), updateUserBooking);

export { bookingRouter };
