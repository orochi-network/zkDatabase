import { ESorting } from '@types';
import Joi from 'joi';
export const sortingOrder = Joi.string().valid(...Object.values(ESorting));

export const indexName = Joi.string()
  .trim()
  .min(2)
  .max(128)
  .required()
  .pattern(/^[_a-z]+[_a-z0-9]+/i);

export const collectionIndex = Joi.object({
  name: indexName,
  sorting: sortingOrder,
});
