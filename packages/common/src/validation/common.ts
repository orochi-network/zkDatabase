import Joi from 'joi';
export const pagination = Joi.object({
  offset: Joi.number().integer().min(0).default(0).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});

export const search = Joi.object({
  search: Joi.optional(),
  pagination,
});
