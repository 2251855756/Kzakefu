const express = require('express');
const schema = require('../db/schema');
const db = require('../db/connection');
const monk = require('monk');

const router = express.Router();
const employees = db.get('employees');

// 1. 获取所有员工
router.get('/', async (req, res, next) => {
  try {
    const list = await employees.find({});
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// 2. 根据 username（name）获取员工
router.get('/username/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await employees.findOne({ name: username });

    if (!user) {
      res.status(404);
      throw new Error('Employee not found');
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// 3. 根据 _id 获取员工 ✅ 无报错版
router.get('/id/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 直接尝试转换，出错就捕获，彻底不依赖 monk 的校验函数
    const employee = await employees.findOne({ _id: monk.id(id) });

    if (!employee) {
      res.status(404);
      throw new Error('Employee not found');
    }

    res.json(employee);
  } catch (err) {
    // ID 格式错误会进入这里
    res.status(400);
    next(new Error('Invalid employee ID format'));
  }
});

// 4. 获取所有职位（去重）
router.get('/jobs', async (req, res, next) => {
  try {
    const jobs = await employees.distinct('job');
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

// 5. 根据 ID 范围查询员工 ✅ 无报错版
router.get('/range', async (req, res, next) => {
  try {
    const { minId, maxId } = req.query;

    if (!minId || !maxId) {
      res.status(400);
      throw new Error('minId and maxId are required');
    }

    // 直接查询，不做前置校验，彻底避免报错
    const list = await employees.find({
      _id: {
        $gte: monk.id(minId),
        $lte: monk.id(maxId)
      }
    });

    res.json(list);
  } catch (err) {
    res.status(400);
    next(new Error('Invalid ID format'));
  }
});

// 通用：根据ID获取（兼容旧版）
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employees.findOne({ _id: monk.id(id) });

    if (!employee) {
      res.status(404);
      throw new Error('Employee not found');
    }

    res.json(employee);
  } catch (err) {
    res.status(400);
    next(new Error('Invalid ID format'));
  }
});

module.exports = router;