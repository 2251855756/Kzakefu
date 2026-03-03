// 生成请求到达时间的中间件
const requestTimestamp = (req, res, next) => {
  // 记录请求到达的时间（ISO格式）
  const requestTime = new Date().toISOString();
  // 设置响应头
  res.setHeader('X-Request-Arrived-At', requestTime);
  next();
};

module.exports = requestTimestamp;