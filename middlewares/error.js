export const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || 'Internal Server Error';
  err.statusCode = err.statusCode || 500;

  return res
    .status(err.statusCode)
    .json({ success: false, message: err.message });
};

export const tryCatch = (inputFunc) => {
  return async (req, res, next) => {
    try {
      await inputFunc(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};
