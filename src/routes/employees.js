/* eslint-disable consistent-return */
const express = require('express');
const schema = require('../db/schema');
const db = require('../db/connection');
const monk = require('monk'); // 用于校验ObjectId

const employees = db.get('employees'); // 操作employees集合（用户=员工）

const router = express.Router();

/**
 * 1. 获取所有员工（原功能保留）
 */
router.get('/', async (req, res, next) => {
  try {
    const allEmployees = await employees.find({});
    res.json(allEmployees);
  } catch (error) {
    next(error);
  }
});

/**
 * 2. 根据username（name字段）获取员工
 * 路径: /api/employees/username/:username
 */
router.get('/username/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    // 校验name格式（复用原有schema）
    await schema.validateAsync({ name: username, job: 'temp' }); // job临时填充，仅校验name

    const employee = await employees.findOne({ name: username });
    if (!employee) {
      const error = new Error(`Employee with username (name) ${username} does not exist`);
      res.status(404);
      return next(error);
    }
    res.json(employee);
  } catch (error) {
    next(error);
  }
});

/**
 * 3. 根据_id获取员工（优化原有/:id逻辑，拆分独立路由更清晰）
 * 路径: /api/employees/id/:id
 */
router.get('/id/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // 校验ObjectId格式
    if (!monk.id.isValid(id)) {
      const error = new Error('Invalid employee ID format');
      res.status(400);
      return next(error);
    }

    const employee = await employees.findOne({ _id: monk.id(id) });
    if (!employee) {
      const error = new Error(`Employee with ID ${id} does not exist`);
      res.status(404);
      return next(error);
    }
    res.json(employee);
  } catch (error) {
    next(error);
  }
});

/**
 * 4. 获取数据库中所有的jobs（去重）
 * 路径: /api/employees/jobs
 */
router.get('/jobs', async (req, res, next) => {
  try {
    // 获取所有员工的job字段，去重
    const jobList = await employees.distinct('job');
    res.json({ jobs: jobList });
  } catch (error) {
    next(error);
  }
});

/**
 * 5. 根据ID范围获取员工（query参数：minId / maxId）
 * 路径: /api/employees/range?minId=xxx&maxId=xxx
 */
router.get('/range', async (req, res, next) => {
  try {
    const { minId, maxId } = req.query;
    if (!minId || !maxId) {
      const error = new Error('Query parameters minId and maxId are required');
      res.status(400);
      return next(error);
    }

    let query = {};
    // 校验ObjectId格式（MongoDB默认ID）
    if (monk.id.isValid(minId) && monk.id.isValid(maxId)) {
      // ObjectId范围查询（按字符串比较）
      query._id = {
        $gte: monk.id(minId),
        $lte: monk.id(maxId)
      };
    } else if (!isNaN(Number(minId)) && !isNaN(Number(maxId))) {
      // 数字ID范围查询（若使用自增数字ID）
      query._id = {
        $gte: Number(minId),
        $lte: Number(maxId)
      };
    } else {
      const error = new Error('minId and maxId must be valid ObjectId or numeric ID');
      res.status(400);
      return next(error);
    }

    const employeesInRange = await employees.find(query);
    res.json(employeesInRange);
  } catch (error) {
    next(error);
  }
});

/**
 * 原有根据_id查询（保留，兼容旧路径）
 * 路径: /api/employees/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // 校验ObjectId格式
    if (!monk.id.isValid(id)) {
      const error = new Error('Invalid employee ID format');
      res.status(400);
      return next(error);
    }

    const employee = await employees.findOne({ _id: monk.id(id) });
    if (!employee) {
      const error = new Error('Employee does not exist');
      res.status(404);
      return next(error);
    }

    res.json(employee);
  } catch (error) {
    next(error);
  }
});

/**
 * 创建员工（原功能保留）
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, job } = req.body;
    await schema.validateAsync({ name, job });

    const employee = await employees.findOne({ name });
    if (employee) {
      const error = new Error('Employee already exists');
      res.status(409);
      return next(error);
    }

    const newEmployee = await employees.insert({ name, job });
    res.status(201).json(newEmployee);
  } catch (error) {
    next(error);
  }
});

/**
 * 更新员工（原功能保留）
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, job } = req.body;
    const result = await schema.validateAsync({ name, job });

    if (!monk.id.isValid(id)) {
      const error = new Error('Invalid employee ID format');
      res.status(400);
      return next(error);
    }

    const employee = await employees.findOne({ _id: monk.id(id) });
    if (!employee) {
      const error = new Error('Employee does not exist');
      res.status(404);
      return next(error);
    }

    const updatedEmployee = await employees.update(
      { _id: monk.id(id) },
      { $set: result },
      { upsert: true }
    );

    res.json(updatedEmployee);
  } catch (error) {
    next(error);
  }
});

/**
 * 删除员工（原功能保留）
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!monk.id.isValid(id)) {
      const error = new Error('Invalid employee ID format');
      res.status(400);
      return next(error);
    }

    const employee = await employees.findOne({ _id: monk.id(id) });
    if (!employee) {
      const error = new Error('Employee does not exist');
      res.status(404);
      return next(error);
    }

    await employees.remove({ _id: monk.id(id) });
    res.json({ message: 'Employee has been deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;