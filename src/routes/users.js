const express = require('express');
const Joi = require('joi');
const db = require('../db/connection');
const userSchema = require('../db/userSchema');

const router = express.Router();
const users = db.get('users'); // 获取 users 集合

// 辅助函数：验证 ObjectId 格式
function isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

// 1. 获取所有用户
router.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort = 'username' } = req.query;
        
        const allUsers = await users.find(
            {},
            {
                limit: parseInt(limit),
                skip: (parseInt(page) - 1) * parseInt(limit),
                sort: { [sort]: 1 }
            }
        );
        
        // 获取总数
        const total = await users.count({});
        
        res.json({
            data: allUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
});

// 2. 根据用户名获取用户
router.get('/username/:username', async (req, res, next) => {
    try {
        const { username } = req.params;
        
        const user = await users.findOne({
            username: username
        });

        if (!user) {
            const error = new Error(`用户名为 ${username} 的用户不存在`);
            res.status(404);
            return next(error);
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
});

// 3. 根据 _id 获取用户
router.get('/id/:_id', async (req, res, next) => {
    try {
        const { _id } = req.params;
        
        // 验证 ID 格式
        if (!isValidObjectId(_id)) {
            const error = new Error('无效的用户ID格式');
            res.status(400);
            return next(error);
        }
        
        const user = await users.findOne({
            _id: _id
        });

        if (!user) {
            const error = new Error(`ID为 ${_id} 的用户不存在`);
            res.status(404);
            return next(error);
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
});

// 4. 获取所有职位（去重）
router.get('/jobs/all', async (req, res, next) => {
    try {
        // 使用聚合管道获取所有不重复的职位
        const distinctJobs = await users.distinct('job');
        
        // 也可以获取每个职位的人数统计
        const jobsWithCount = await users.aggregate([
            {
                $group: {
                    _id: '$job',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    job: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            {
                $sort: { job: 1 }
            }
        ]);

        res.json({
            jobs: distinctJobs,
            jobsWithCount: jobsWithCount,
            total: distinctJobs.length
        });
    } catch (error) {
        next(error);
    }
});

// 5. 获取 ID 在给定范围内的用户
router.get('/range', async (req, res, next) => {
    try {
        const { start, end, page = 1, limit = 10 } = req.query;
        
        // 验证参数
        if (!start || !end) {
            const error = new Error('请提供 start 和 end 参数');
            res.status(400);
            return next(error);
        }
        
        // 验证 ID 格式
        if (!isValidObjectId(start) || !isValidObjectId(end)) {
            const error = new Error('无效的ID格式');
            res.status(400);
            return next(error);
        }
        
        // MongoDB 的 _id 是基于时间的，所以可以这样范围查询
        // 但更准确的做法是使用 $gte 和 $lte
        const usersInRange = await users.find(
            {
                $and: [
                    { _id: { $gte: start } },
                    { _id: { $lte: end } }
                ]
            },
            {
                limit: parseInt(limit),
                skip: (parseInt(page) - 1) * parseInt(limit)
            }
        );
        
        const total = await users.count({
            $and: [
                { _id: { $gte: start } },
                { _id: { $lte: end } }
            ]
        });
        
        res.json({
            data: usersInRange,
            pagination: {
                start,
                end,
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
});

// 创建新用户（POST）
router.post('/', async (req, res, next) => {
    try {
        // 验证输入数据
        const validatedData = await userSchema.validateAsync(req.body);
        
        // 检查用户名是否已存在
        const existingUser = await users.findOne({
            username: validatedData.username
        });
        
        if (existingUser) {
            const error = new Error('用户名已存在');
            res.status(409);
            return next(error);
        }
        
        // 添加创建时间
        validatedData.createdAt = new Date();
        
        // 插入新用户
        const newUser = await users.insert(validatedData);
        
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
});

// 更新用户（PUT）
router.put('/:_id', async (req, res, next) => {
    try {
        const { _id } = req.params;
        
        if (!isValidObjectId(_id)) {
            const error = new Error('无效的用户ID格式');
            res.status(400);
            return next(error);
        }
        
        // 验证输入数据
        const validatedData = await userSchema.validateAsync(req.body);
        
        // 检查用户是否存在
        const existingUser = await users.findOne({ _id });
        
        if (!existingUser) {
            const error = new Error('用户不存在');
            res.status(404);
            return next(error);
        }
        
        // 如果用户名被修改，检查新用户名是否已被使用
        if (validatedData.username !== existingUser.username) {
            const userWithSameUsername = await users.findOne({
                username: validatedData.username
            });
            
            if (userWithSameUsername) {
                const error = new Error('用户名已被使用');
                res.status(409);
                return next(error);
            }
        }
        
        // 更新用户
        const updatedUser = await users.update(
            { _id },
            { $set: validatedData }
        );
        
        res.json({
            message: '用户更新成功',
            updated: updatedUser
        });
    } catch (error) {
        next(error);
    }
});

// 删除用户（DELETE）
router.delete('/:_id', async (req, res, next) => {
    try {
        const { _id } = req.params;
        
        if (!isValidObjectId(_id)) {
            const error = new Error('无效的用户ID格式');
            res.status(400);
            return next(error);
        }
        
        const existingUser = await users.findOne({ _id });
        
        if (!existingUser) {
            const error = new Error('用户不存在');
            res.status(404);
            return next(error);
        }
        
        await users.remove({ _id });
        
        res.json({
            message: '用户删除成功',
            deletedUser: existingUser
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;