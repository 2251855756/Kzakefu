// 中间件：添加请求到达时间到响应头
function requestTime(req, res, next) {
    // 获取当前时间
    const requestArrivalTime = new Date().toISOString();
    
    // 添加到响应头
    res.setHeader('X-Request-Arrival-Time', requestArrivalTime);
    
    // 也可以添加到请求对象，方便后续使用
    req.requestTime = requestArrivalTime;
    
    // 继续处理请求
    next();
}

module.exports = requestTime;