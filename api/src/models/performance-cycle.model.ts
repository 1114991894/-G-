import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface PerformanceCycleAttributes {
  id: string;
  tenantId: string;
  name: string;
  type: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'scoring' | 'completed' | 'closed';
  description?: string;
  config?: any;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PerformanceCycleCreationAttributes extends Optional<PerformanceCycleAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class PerformanceCycle extends Model<PerformanceCycleAttributes, PerformanceCycleCreationAttributes> implements PerformanceCycleAttributes {
  public id!: string;
  public tenantId!: string;
  public name!: string;
  public type!: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  public startDate!: Date;
  public endDate!: Date;
  public status!: 'draft' | 'active' | 'scoring' | 'completed' | 'closed';
  public description?: string;
  public config?: any;
  public createdBy!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initPerformanceCycleModel(sequelize: Sequelize): void {
  PerformanceCycle.init({
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '周期名称'
    },
    type: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'half_yearly', 'yearly'),
      allowNull: false,
      comment: '周期类型'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '开始日期'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '结束日期'
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'scoring', 'completed', 'closed'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '状态'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '描述'
    },
    config: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '配置信息'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '创建人'
    }
  }, {
    sequelize,
    tableName: 'performance_cycles',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['startDate', 'endDate'] }
    ]
  });
}

export default { PerformanceCycle, initPerformanceCycleModel };
