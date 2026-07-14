import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { Tenant } from './tenant.model';
import { Role } from './role.model';
import { Employee } from './employee.model';

export interface UserAttributes {
  id: string;
  tenantId: string;
  username: string;
  password: string;
  email: string;
  phone?: string;
  realName: string;
  avatar?: string;
  roleId: string;
  departmentId?: string;
  employeeId?: string;
  status: 'active' | 'inactive' | 'locked';
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginCount: number;
  passwordVersion: number;
  settings?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'status' | 'loginCount' | 'passwordVersion' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public tenantId!: string;
  public username!: string;
  public password!: string;
  public email!: string;
  public phone?: string;
  public realName!: string;
  public avatar?: string;
  public roleId!: string;
  public departmentId?: string;
  public employeeId?: string;
  public status!: 'active' | 'inactive' | 'locked';
  public lastLoginAt?: Date;
  public lastLoginIp?: string;
  public loginCount!: number;
  public passwordVersion!: number;
  public settings?: any;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public tenant?: Tenant;
  public role?: Role;
  public employee?: Employee;
}

export function initUserModel(sequelize: Sequelize): void {
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '租户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '用户名'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码（加密）'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '邮箱'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号'
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '真实姓名'
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '头像URL'
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '角色ID'
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '部门ID'
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '员工ID'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'locked'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    },
    lastLoginIp: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '最后登录IP'
    },
    loginCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '登录次数'
    },
    passwordVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '密码版本（用于强制重新登录）'
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '用户设置（第三方账号绑定等）'
    }
  }, {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['roleId'] },
      { fields: ['status'] }
    ]
  });
}

export default { User, initUserModel };
