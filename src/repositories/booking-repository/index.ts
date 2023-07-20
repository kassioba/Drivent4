import { prisma } from '@/config';

export async function selectBookingByUserIdWithRoom(userId: number) {
  return prisma.booking.findFirst({
    where: { userId },
    select: {
      id: true,
      Room: true,
    },
  });
}

export async function selectRoomById(id: number) {
  return prisma.room.findUnique({
    where: {
      id,
    },
  });
}

export async function selectBookingByRoomId(roomId: number) {
  return prisma.booking.findMany({
    where: { roomId },
  });
}

export async function insertBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId,
    },
  });
}

export async function selectBookingById(id: number) {
  return prisma.booking.findUnique({
    where: { id },
  });
}

export async function updateBooking(roomId: number, id: number) {
  return prisma.booking.update({
    where: { id },
    data: { roomId },
  });
}
