import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface IndicatorAttributes {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  type: 'quantitative' | 'qualitative';
  category?: string;
  unit?: string;
  calculationMethod?: string;
  dataSource?: string;
  targetValue?: string;
  excellentValue?: string;
  goodValue?: string;
  passValue?: string;
  weight: number;
  scoreType: 'auto' | 'manual';
  isTemplate: boolean;
  templateCategory?: string;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IndicatorCreationAttributes extends Optional<IndicatorAttributes, 'id' | 'weight' | 'isTemplate' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Indicator extends Model<IndicatorAttributes, IndicatorCreationAttributes> implements IndicatorAttributes {
  public id!: string;
  public tenantId!: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public type!: 'quantitative' | 'qualitative';
  public category?: string;
  public unit?: string;
  public calculationMethod?: string;
  public dataSource?: string;
  public targetValue?: string;
  public excellentValue?: string;
  public goodValue?: string;
  public passValue?: string;
  public weight!: number;
  public scoreType!: 'auto' | 'manual';
  public isTemplate!: boolean;
  public templateCategory?: string;
  public status!: 'active' | 'inactive';
  public createdBy!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initIndicatorModel(sequelize: Sequelize): void {
  Indicator.init({
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
      comment: '指标名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '指标编码'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '指标描述'
    },
    type: {
      type: DataTypes.ENUM('quantitative', 'qualitative'),
      allowNull: false,
      comment: '类型：quantitative-定量，qualitative-定性'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '分类'
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '单位'
    },
    calculationMethod: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '计算方法'
    },
    dataSource: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '数据来源'
    },
    targetValue: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '目标值'
    },
    excellentValue: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '优秀值'
    },
    goodValue: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '良好值'
    },
    passValue: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '及格值'
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '权重'
    },
    scoreType: {
      type: DataTypes.ENUM('auto', 'manual'),
      allowNull: false,
      defaultValue: 'manual',
      comment: '计分方式：auto-自动，manual-手动'
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否模板'
    },
    templateCategory: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '模板分类'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '创建人'
    }
  }, {
    sequelize,
    tableName: 'indicators',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['isTemplate'] },
      { fields: ['category'] },
      { fields: ['status'] }
    ]
  });
}

export default { Indicator, initIndicatorModel };
