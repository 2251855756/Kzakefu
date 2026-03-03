const Joi = require('joi');

const userSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.alphanum': '用户名只能包含字母和数字',
            'string.min': '用户名至少需要3个字符',
            'string.max': '用户名不能超过30个字符',
            'any.required': '用户名为必填项'
        }),
    
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': '请提供有效的邮箱地址',
            'any.required': '邮箱为必填项'
        }),
    
    job: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': '职位至少需要2个字符',
            'string.max': '职位不能超过50个字符',
            'any.required': '职位为必填项'
        }),
    
    age: Joi.number()
        .integer()
        .min(18)
        .max(100)
        .optional(),
    
    createdAt: Joi.date()
        .default(Date.now)
});

module.exports = userSchema;