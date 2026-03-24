module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
    'no-unused-vars': 'off', // 关闭未使用变量检查
    'no-undef': 'off', // 关闭未定义变量检查
    'no-console': 'off', // 关闭 console 警告
    'no-await-in-loop': 'off', // 关闭循环中 await 检查
    'import/no-unresolved': 'off', // 关闭导入路径检查
    'import/extensions': 'off',
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 2018,
  },
};
