import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface SharedEmployeeAttributes {
  id: string;
  key: string;
  name: string;
  phone: string;
  password: string;
  department: string;
  departmentId: string;
  role: string;
  roleCode: string;
  status: string;
  position: string;
  tenantName: string;
  tenantId?: string;
  joinDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SharedEmployeeCreationAttributes extends Optional<SharedEmployeeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SharedEmployee extends Model<SharedEmployeeAttributes, SharedEmployeeCreationAttributes> implements SharedEmployeeAttributes {
  public id!: string;
  public key!: string;
  public name!: string;
  public phone!: string;
  public password!: string;
  public department!: string;
  public departmentId!: string;
  public role!: string;
  public roleCode!: string;
  public status!: string;
  public position!: string;
  public tenantName!: string;
  public tenantId?: string;
  public joinDate?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initSharedEmployeeModel(sequelize: Sequelize): void {
  SharedEmployee.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '唯一标识'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '姓名'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '手机号'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码（加密）'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '部门名称'
    },
    departmentId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '部门ID'
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '角色名称'
    },
    roleCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '角色编码'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    },
    position: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '职位'
    },
    tenantName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '租户名称'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '租户ID'
    },
    joinDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '入职日期'
    }
  }, {
    sequelize,
    tableName: 'shared_employees',
    timestamps: true,
    indexes: [
      { fields: ['key'], unique: true },
      { fields: ['phone'] },
      { fields: ['tenantName'] },
      { fields: ['status'] }
    ]
  });
}

export default { SharedEmployee, initSharedEmployeeModel };