import Joi from 'joi';
export const pagination = Joi.object({
  offset: Joi.number().integer().min(0).default(0).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});

export const timestamp = Joi.number()
  .custom((value, helper) => {
    // 5 minutes is the timeout for signing up proof
    const timeDiff = Math.floor(Date.now() / 1000) - value;
    if (timeDiff >= 0 && timeDiff < 300) {
      return value;
    }
    return helper.error('Invalid timestamp of time proof');
  })
  .required();

export const search = Joi.object({
  search: Joi.optional(),
  pagination,
});
