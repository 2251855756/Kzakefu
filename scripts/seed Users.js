const db = require('../db/connection');

async function seedUsers() {
    const users = db.get('users');
    
    // 清空现有数据
    await users.remove({});
    
    // 插入测试数据
    const testUsers = [
        { username: 'alice', email: 'alice@example.com', job: '工程师', age: 28 },
        { username: 'bob', email: 'bob@example.com', job: '设计师', age: 32 },
        { username: 'charlie', email: 'charlie@example.com', job: '产品经理', age: 35 },
        { username: 'david', email: 'david@example.com', job: '工程师', age: 25 },
        { username: 'eve', email: 'eve@example.com', job: '市场专员', age: 29 },
        { username: 'frank', email: 'frank@example.com', job: '销售', age: 41 },
        { username: 'grace', email: 'grace@example.com', job: '工程师', age: 31 },
        { username: 'henry', email: 'henry@example.com', job: '设计师', age: 27 },
    ];
    
    for (const user of testUsers) {
        user.createdAt = new Date();
        await users.insert(user);
    }
    
    console.log('测试用户数据插入成功！');
    process.exit(0);
}

seedUsers().catch(console.error);