const express = require('express');

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middlewares');
// 引入请求时间戳中间件
const requestTimestamp = require('./middlewares/requestTimestamp');

const app = express();

app.use(helmet());
// 挂载时间戳中间件（所有请求都会添加响应头）
app.use(requestTimestamp);
app.use(morgan('dev'));
app.use(bodyParser.json());

const employees = require('./routes/employees');
const user = require('./routes/user');

app.use('/api/user', user);
app.use('/api/employees', employees);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
