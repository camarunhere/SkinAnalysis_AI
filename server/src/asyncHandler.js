// Express 4 doesn't forward a rejected promise from an async route handler to
// error-handling middleware -- it becomes an unhandled rejection and crashes
// the whole process (e.g. a malformed :id causing Mongoose's CastError).
// Wrapping handlers with this forwards any thrown/rejected error to next(err).
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
