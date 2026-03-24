const requestTimeMiddleware = (req, res, next) => {
  const arriveTime = new Date().toISOString();
  res.setHeader('X-Request-Arrived-Time', arriveTime);
  next();
};

module.exports = requestTimeMiddleware;
