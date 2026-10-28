import { ApiError } from '../utils/apiError.js';

export const validateRequest = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            location: 'params',
            path: issue.path.join('.'),
            message: issue.message
          }))
        );
      } else {
        req.params = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            location: 'query',
            path: issue.path.join('.'),
            message: issue.message
          }))
        );
      } else {
        req.query = result.data;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            location: 'body',
            path: issue.path.join('.'),
            message: issue.message
          }))
        );
      } else {
        req.body = result.data;
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(400, 'Validation Error', errors));
    }

    next();
  };
};
