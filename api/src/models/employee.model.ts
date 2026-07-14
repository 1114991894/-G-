import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface EmployeeAttributes {
  id: string;
  tenantId: string;
  userId?: string;
  employeeNo: string;
  name: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: Date;
  idCard?: string;
  phone?: string;
  email?: string;
  address?: string;
  departmentId?: string;
  position?: string;
  level?: string;
  managerId?: string;
  entryDate?: Date;
  probationEndDate?: Date;
  regularDate?: Date;
  contractStartDate?: Date;
  contractEndDate?: Date;
  status: 'active' | 'inactive' | 'probation' | 'leave';
  education?: string;
  major?: string;
  school?: string;
  workYears?: number;
  avatar?: string;
  attachments?: any;
  customFields?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  public id!: string;
  public tenantId!: string;
  public userId?: string;
  public employeeNo!: string;
  public name!: string;
  public gender?: 'male' | 'female' | 'other';
  public birthDate?: Date;
  public idCard?: string;
  public phone?: string;
  public email?: string;
  public address?: string;
  public departmentId?: string;
  public position?: string;
  public level?: string;
  public managerId?: string;
  public entryDate?: Date;
  public probationEndDate?: Date;
  public regularDate?: Date;
  public contractStartDate?: Date;
  public contractEndDate?: Date;
  public status!: 'active' | 'inactive' | 'probation' | 'leave';
  public education?: string;
  public major?: string;
  public school?: string;
  public workYears?: number;
  public avatar?: string;
  public attachments?: any;
  public customFields?: any;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initEmployeeModel(sequelize: Sequelize): void {
  Employee.init({
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
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '用户ID'
    },
    employeeNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '工号'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '姓名'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
      comment: '性别'
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '出生日期'
    },
    idCard: {
      type: DataTypes.STRING(18),
      allowNull: true,
      comment: '身份证号'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '地址'
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '部门ID'
    },
    position: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '职位'
    },
    level: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '职级'
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '直属上级ID'
    },
    entryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '入职日期'
    },
    probationEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '试用期结束日期'
    },
    regularDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '转正日期'
    },
    contractStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '合同开始日期'
    },
    contractEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '合同结束日期'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'probation', 'leave'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    },
    education: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '学历'
    },
    major: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '专业'
    },
    school: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '毕业院校'
    },
    workYears: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '工作年限'
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '头像URL'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '附件'
    },
    customFields: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '自定义字段'
    }
  }, {
    sequelize,
    tableName: 'employees',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['departmentId'] },
      { fields: ['managerId'] },
      { fields: ['employeeNo'] },
      { fields: ['status'] }
    ]
  });
}

export default { Employee, initEmployeeModel };
