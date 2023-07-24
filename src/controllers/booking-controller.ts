import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import { getBookingByUserIdWithRoom, postBookingByRoomId, updateUserBookingRoomById } from '@/services/booking-service';

export async function getUserBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    res.send(await getBookingByUserIdWithRoom(userId));
  } catch (err) {
    if (err.name === 'NotFoundError') return res.status(httpStatus.NOT_FOUND).send(err.message);
  }
}

export async function postUserBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;

  try {
    res.send(await postBookingByRoomId(userId, roomId));
  } catch (err) {
    if (err.name === 'NotFoundError') return res.status(httpStatus.NOT_FOUND).send(err.message);
    if (err.name === 'forbiddenError') return res.status(httpStatus.FORBIDDEN).send(err.message);
  }
}

export async function updateUserBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  const bookingId = Number(req.params.bookingId);

  try {
    res.send(await updateUserBookingRoomById(userId, roomId, bookingId));
  } catch (err) {
    if (err.name === 'NotFoundError') return res.status(httpStatus.NOT_FOUND).send(err.message);
    if (err.name === 'forbiddenError') return res.status(httpStatus.FORBIDDEN).send(err.message);
  }
}
