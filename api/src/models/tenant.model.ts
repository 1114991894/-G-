import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface TenantAttributes {
  id: string;
  name: string;
  type: 'client' | 'server';
  industry?: string;
  scale?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  status: 'active' | 'inactive' | 'trial';
  trialEndDate?: Date;
  settings?: any;
  maxEmployees?: number;
  currentEmployees?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantCreationAttributes extends Optional<TenantAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Tenant extends Model<TenantAttributes, TenantCreationAttributes> implements TenantAttributes {
  public id!: string;
  public name!: string;
  public type!: 'client' | 'server';
  public industry?: string;
  public scale?: string;
  public contactName?: string;
  public contactPhone?: string;
  public contactEmail?: string;
  public address?: string;
  public status!: 'active' | 'inactive' | 'trial';
  public trialEndDate?: Date;
  public settings?: any;
  public maxEmployees?: number;
  public currentEmployees?: number;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTenantModel(sequelize: Sequelize): void {
  Tenant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '企业/机构名称'
    },
    type: {
      type: DataTypes.ENUM('client', 'server'),
      allowNull: false,
      comment: '类型：client-客户端企业，server-服务端机构'
    },
    industry: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '行业'
    },
    scale: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '规模'
    },
    contactName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '联系人姓名'
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系人电话'
    },
    contactEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '联系人邮箱'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '地址'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'trial'),
      allowNull: false,
      defaultValue: 'trial',
      comment: '状态'
    },
    trialEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '试用结束日期'
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '配置信息'
    },
    maxEmployees: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 100,
      comment: '最大员工数'
    },
    currentEmployees: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: '当前员工数'
    }
  }, {
    sequelize,
    tableName: 'tenants',
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['name'] }
    ]
  });
}

export default { Tenant, initTenantModel };
