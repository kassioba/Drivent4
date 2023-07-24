import supertest from 'supertest';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import faker from '@faker-js/faker';
import {
  createBooking,
  createEnrollmentWithAddress,
  createHotel,
  createRoomWithHotelId,
  createSession,
  createTicket,
  createTicketType,
  createTicketTypeRemote,
  createTicketTypeWithHotel,
  createTicketTypeWithoutHotel,
  createUser,
} from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should responde with status 404 when booking was not found', async () => {
      const token = await generateValidToken();

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should responde with status 200 and booking data', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const { status, body } = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe('POST /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.post('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 400 when body is not present', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({});
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('should respond with status 404 when roomId does not exist', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: 999999 });
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 403 when room is full', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 when ticket is remote', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 when ticket does not include hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithoutHotel();
      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 when ticket is not paid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, 'RESERVED');

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 200 and bookingId', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, 'PAID');

      const { body, status } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });

      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({ bookingId: expect.any(Number) });
    });
  });
});

describe('PUT /booking/:bookingId', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.put('/booking/0');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.put('/booking/0').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.put('/booking/0').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with 403 when user do not have a booking', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const auxUser = await createUser();
      const booking = await createBooking(auxUser.id, room.id);

      const response = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with 403 when room is full', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const auxRoom = await createRoomWithHotelId(hotel.id);
      await createBooking(user.id, auxRoom.id);
      await createBooking(user.id, auxRoom.id);
      await createBooking(user.id, auxRoom.id);

      const response = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: auxRoom.id });
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with 404 when room does not exist', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const response = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: 999999999 });
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 200 and bookingId', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const auxHotel = await createHotel();
      const auxRoom = await createRoomWithHotelId(auxHotel.id);

      const { body, status } = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: auxRoom.id });
      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({ bookingId: booking.id });
    });
  });
});
