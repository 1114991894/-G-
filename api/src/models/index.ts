import { Sequelize } from 'sequelize';
import { initUserModel, User } from './user.model';
import { initTenantModel, Tenant } from './tenant.model';
import { initRoleModel, Role } from './role.model';
import { initDepartmentModel, Department } from './department.model';
import { initEmployeeModel, Employee } from './employee.model';
import { initGoalModel, Goal } from './goal.model';
import { initIndicatorModel, Indicator } from './indicator.model';
import { initPerformanceCycleModel, PerformanceCycle } from './performance-cycle.model';
import { initScoreModel, Score } from './score.model';
import { initNotificationModel, Notification } from './notification.model';
import initTalentGridModelFn, { TalentGrid } from './talent-grid.model';
import initEvaluation360ModelFn, { Evaluation360 } from './evaluation-360.model';
import initCompetencyModelFn, { Competency } from './competency.model';
import { initServerAdminModel, ServerAdmin } from './server-admin.model';
import { initTrialApplicationModel, TrialApplication } from './trial-application.model';
import { initServerNotificationModel, ServerNotification } from './server-notification.model';
import { initSharedEmployeeModel, SharedEmployee } from './shared-employee.model';

export {
  User,
  Tenant,
  Role,
  Department,
  Employee,
  Goal,
  Indicator,
  PerformanceCycle,
  Score,
  Notification,
  TalentGrid,
  Evaluation360,
  Competency,
  ServerAdmin,
  TrialApplication,
  ServerNotification,
  SharedEmployee,
};

export function initModels(sequelize: Sequelize): void {
  // 初始化所有模型
  initUserModel(sequelize);
  initTenantModel(sequelize);
  initRoleModel(sequelize);
  initDepartmentModel(sequelize);
  initEmployeeModel(sequelize);
  initGoalModel(sequelize);
  initIndicatorModel(sequelize);
  initPerformanceCycleModel(sequelize);
  initScoreModel(sequelize);
  initNotificationModel(sequelize);
  initTalentGridModelFn(sequelize);
  initEvaluation360ModelFn(sequelize);
  initCompetencyModelFn(sequelize);
  initServerAdminModel(sequelize);
  initTrialApplicationModel(sequelize);
  initServerNotificationModel(sequelize);
  initSharedEmployeeModel(sequelize);

  // 定义模型关联
  
  // Tenant 关联
  Tenant.hasMany(User, { foreignKey: 'tenantId', as: 'users' });
  Tenant.hasMany(Department, { foreignKey: 'tenantId', as: 'departments' });
  Tenant.hasMany(Employee, { foreignKey: 'tenantId', as: 'employees' });
  
  // User 关联
  User.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  User.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  
  // Role 关联
  Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
  
  // Department 关联（自关联）
  Department.belongsTo(Department, { foreignKey: 'parentId', as: 'parent' });
  Department.hasMany(Department, { foreignKey: 'parentId', as: 'children' });
  Department.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees' });
  Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' });
  
  // Employee 关联
  Employee.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
  Employee.belongsTo(Employee, { foreignKey: 'managerId', as: 'manager' });
  Employee.hasMany(Employee, { foreignKey: 'managerId', as: 'subordinates' });
  Employee.hasMany(User, { foreignKey: 'employeeId', as: 'users' });
  Employee.hasMany(Goal, { foreignKey: 'employeeId', as: 'goals' });
  Employee.hasMany(Score, { foreignKey: 'employeeId', as: 'scores' });
  
  // Goal 关联
  Goal.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Goal.belongsTo(PerformanceCycle, { foreignKey: 'cycleId', as: 'cycle' });
  Goal.belongsTo(Goal, { foreignKey: 'parentGoalId', as: 'parentGoal' });
  Goal.hasMany(Goal, { foreignKey: 'parentGoalId', as: 'childGoals' });
  
  // PerformanceCycle 关联
  PerformanceCycle.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  PerformanceCycle.hasMany(Goal, { foreignKey: 'cycleId', as: 'goals' });
  PerformanceCycle.hasMany(Score, { foreignKey: 'cycleId', as: 'scores' });
  
  // Score 关联
  Score.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Score.belongsTo(PerformanceCycle, { foreignKey: 'cycleId', as: 'cycle' });
  Score.belongsTo(Indicator, { foreignKey: 'indicatorId', as: 'indicator' });
  
  // Indicator 关联
  Indicator.hasMany(Score, { foreignKey: 'indicatorId', as: 'scores' });
  
  // Notification 关联
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
}

export default { initModels };