import ticketsRepository from '../../repositories/tickets-repository';
import enrollmentRepository from '../../repositories/enrollment-repository';
import { forbiddenError } from './errors';
import {
  insertBooking,
  selectBookingById,
  selectBookingByRoomId,
  selectBookingByUserIdWithRoom,
  selectRoomById,
  updateBooking,
} from '@/repositories/booking-repository';
import { notFoundError } from '@/errors';

export async function getBookingByUserIdWithRoom(userId: number) {
  const booking = await selectBookingByUserIdWithRoom(userId);

  if (!booking) throw notFoundError();

  return booking;
}

export async function postBookingByRoomId(userId: number, roomId: number) {
  const room = await selectRoomById(roomId);

  if (!room) throw notFoundError();

  const roomBookings = await selectBookingByRoomId(roomId);

  if (roomBookings.length >= room.capacity) throw forbiddenError();

  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);

  if (ticket.status !== 'PAID' || !ticket.TicketType.includesHotel || ticket.TicketType.isRemote)
    throw forbiddenError();

  const booking = await insertBooking(userId, roomId);

  return { bookingId: booking.id };
}

export async function updateUserBookingRoomById(userId: number, roomId: number, bookingId: number) {
  const booking = await selectBookingById(bookingId);

  if (booking?.userId !== userId) throw forbiddenError;

  const room = await selectRoomById(roomId);

  if (!room) throw notFoundError();

  const roomBookings = await selectBookingByRoomId(roomId);

  if (roomBookings.length >= room.capacity) throw forbiddenError();

  await updateBooking(roomId, bookingId);

  return { bookingId };
}
