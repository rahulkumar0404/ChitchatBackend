export const errorMiddleware = (err, req, res, next) => {
  err.message = err.message || 'Internal Server Error';
  err.statusCode = err.statusCode || 500;

  if(err.code === 11000){
    const error =  Object.keys(err.keyPattern).join(',')
    err.message = `Duplicate field ${error}`
    err.statusCode = 400
  }

  if(err.name === 'CastError'){
    const errorPath = err.path;
    err.message = `Invalid Format of ${errorPath}`
    err.statusCode = 400
  }

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
