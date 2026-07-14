import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import { initModels, Tenant, User, Role, Department, Employee } from './models';

// 数据库配置
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bwg_performance',
  logging: false,
});

async function seed() {
  try {
    // 初始化模型
    initModels(sequelize);

    // 同步数据库（创建表）
    await sequelize.sync({ force: true }); // 警告：这会删除所有数据
    console.log('✅ 数据库表创建成功');

    // 1. 创建默认租户（企业）
    const tenant = await Tenant.create({
      name: '百鲸咨询',
      type: 'client',
      contactName: '管理员',
      contactPhone: '13800138000',
      contactEmail: 'admin@bwg.com',
      status: 'active',
      maxEmployees: 100,
      currentEmployees: 0,
    });
    console.log('✅ 租户创建成功:', tenant.name);

    // 2. 创建角色
    const adminRole = await Role.create({
      tenantId: tenant.id,
      name: '系统管理员',
      code: 'admin',
      description: '系统管理员，拥有所有权限',
      permissions: {
        system: ['view', 'edit', 'delete'],
        performance: ['view', 'edit', 'delete'],
        talent: ['view', 'edit', 'delete'],
        report: ['view', 'export'],
      },
      dataScope: 'all',
      level: 1,
      status: 'active',
    });

    const hrRole = await Role.create({
      tenantId: tenant.id,
      name: 'HR经理',
      code: 'hr',
      description: 'HR经理，负责人力资源和绩效管理',
      permissions: {
        system: ['view'],
        performance: ['view', 'edit'],
        talent: ['view', 'edit'],
        report: ['view', 'export'],
      },
      dataScope: 'department',
      level: 2,
      status: 'active',
    });

    const managerRole = await Role.create({
      tenantId: tenant.id,
      name: '部门经理',
      code: 'manager',
      description: '部门经理，管理本部门员工',
      permissions: {
        system: ['view'],
        performance: ['view', 'edit'],
        talent: ['view'],
        report: ['view'],
      },
      dataScope: 'department',
      level: 3,
      status: 'active',
    });

    const employeeRole = await Role.create({
      tenantId: tenant.id,
      name: '员工',
      code: 'employee',
      description: '普通员工',
      permissions: {
        system: ['view'],
        performance: ['view'],
        talent: ['view'],
        report: ['view'],
      },
      dataScope: 'self',
      level: 4,
      status: 'active',
    });

    console.log('✅ 角色创建成功');

    // 3. 创建部门
    const techDept = await Department.create({
      tenantId: tenant.id,
      name: '技术部',
      code: 'TECH',
      description: '技术研发部门',
      managerId: null, // 稍后更新
      parentId: null,
      level: 1,
      sortOrder: 1,
      status: 'active',
    });

    const hrDept = await Department.create({
      tenantId: tenant.id,
      name: '人力资源部',
      code: 'HR',
      description: '人力资源管理部',
      managerId: null,
      parentId: null,
      level: 1,
      sortOrder: 2,
      status: 'active',
    });

    console.log('✅ 部门创建成功');

    // 4. 创建用户
    const hashedPassword = await bcrypt.hash('123456', 10);

    const adminUser = await User.create({
      tenantId: tenant.id,
      username: 'admin',
      password: hashedPassword,
      email: 'admin@bwg.com',
      phone: '13800138000',
      realName: '系统管理员',
      roleId: adminRole.id,
      status: 'active',
    });

    const hrUser = await User.create({
      tenantId: tenant.id,
      username: 'hr',
      password: hashedPassword,
      email: 'hr@bwg.com',
      phone: '13800138001',
      realName: 'HR经理',
      roleId: hrRole.id,
      status: 'active',
    });

    const managerUser = await User.create({
      tenantId: tenant.id,
      username: 'manager',
      password: hashedPassword,
      email: 'manager@bwg.com',
      phone: '13800138002',
      realName: '部门经理',
      roleId: managerRole.id,
      status: 'active',
    });

    const employeeUser = await User.create({
      tenantId: tenant.id,
      username: 'employee',
      password: hashedPassword,
      email: 'employee@bwg.com',
      phone: '13800138003',
      realName: '张三',
      roleId: employeeRole.id,
      status: 'active',
    });

    console.log('✅ 用户创建成功');

    await Employee.create({
      tenantId: tenant.id,
      userId: adminUser.id,
      departmentId: techDept.id,
      employeeNo: 'EMP001',
      name: '系统管理员',
      position: '技术总监',
      status: 'active',
    });

    const hrEmployee = await Employee.create({
      tenantId: tenant.id,
      userId: hrUser.id,
      departmentId: hrDept.id,
      employeeNo: 'EMP002',
      name: 'HR经理',
      position: 'HR经理',
      status: 'active',
    });

    const managerEmployee = await Employee.create({
      tenantId: tenant.id,
      userId: managerUser.id,
      departmentId: techDept.id,
      employeeNo: 'EMP003',
      name: '部门经理',
      position: '技术经理',
      status: 'active',
    });

    await Employee.create({
      tenantId: tenant.id,
      userId: employeeUser.id,
      departmentId: techDept.id,
      employeeNo: 'EMP004',
      name: '张三',
      position: '前端工程师',
      status: 'active',
    });

    console.log('✅ 员工记录创建成功');

    // 6. 更新部门经理
    await techDept.update({ managerId: managerEmployee.id });
    await hrDept.update({ managerId: hrEmployee.id });

    console.log('\n🎉 种子数据创建成功！\n');
    console.log('📝 默认登录账户：\n');
    console.log('管理员账户：');
    console.log('  用户名: admin');
    console.log('  密码: 123456\n');
    console.log('HR经理账户：');
    console.log('  用户名: hr');
    console.log('  密码: 123456\n');
    console.log('部门经理账户：');
    console.log('  用户名: manager');
    console.log('  密码: 123456\n');
    console.log('员工账户：');
    console.log('  用户名: employee');
    console.log('  密码: 123456\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
    process.exit(1);
  }
}

seed();
