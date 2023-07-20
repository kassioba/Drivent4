import Joi from 'joi';

export const bookingSchema = Joi.object({
  roomId: Joi.number().min(1).required(),
});

export const bookingParamsSchema = Joi.object({
  bookingId: Joi.number().min(1).required(),
});
