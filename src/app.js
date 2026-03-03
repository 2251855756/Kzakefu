const express = require('express');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { notFound, errorHandler } = require('./middlewares');
const requestTime = require('./middlewares/requestTime'); // 新增

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(requestTime); // 新增：使用请求时间中间件

const employees = require('./routes/employees');
const users = require('./routes/users'); // 新增：用户路由

app.use('/api/employees', employees);
app.use('/api/users', users); // 新增：注册用户路由

app.use(notFound);
app.use(errorHandler);

module.exports = app;