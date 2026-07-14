import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface GoalAttributes {
  id: string;
  tenantId: string;
  employeeId: string;
  cycleId: string;
  parentGoalId?: string;
  title: string;
  description?: string;
  type: 'personal' | 'department' | 'company';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  targetValue?: string;
  currentValue?: string;
  unit?: string;
  startDate?: Date;
  endDate?: Date;
  weight: number;
  score?: number;
  feedback?: string;
  aiSuggestions?: any;
  attachments?: any;
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GoalCreationAttributes extends Optional<GoalAttributes, 'id' | 'progress' | 'weight' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Goal extends Model<GoalAttributes, GoalCreationAttributes> implements GoalAttributes {
  public id!: string;
  public tenantId!: string;
  public employeeId!: string;
  public cycleId!: string;
  public parentGoalId?: string;
  public title!: string;
  public description?: string;
  public type!: 'personal' | 'department' | 'company';
  public status!: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public progress!: number;
  public targetValue?: string;
  public currentValue?: string;
  public unit?: string;
  public startDate?: Date;
  public endDate?: Date;
  public weight!: number;
  public score?: number;
  public feedback?: string;
  public aiSuggestions?: any;
  public attachments?: any;
  public createdBy!: string;
  public updatedBy!: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initGoalModel(sequelize: Sequelize): void {
  Goal.init({
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
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '员工ID'
    },
    cycleId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '绩效周期ID'
    },
    parentGoalId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '父目标ID（用于目标分解）'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '目标标题'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '目标描述'
    },
    type: {
      type: DataTypes.ENUM('personal', 'department', 'company'),
      allowNull: false,
      comment: '目标类型'
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'completed'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '状态'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
      comment: '优先级'
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
      comment: '进度（0-100）'
    },
    targetValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '目标值'
    },
    currentValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '当前值'
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '单位'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '开始日期'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '结束日期'
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '权重'
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '得分'
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '反馈'
    },
    aiSuggestions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'AI建议'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '附件'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '创建人'
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '更新人'
    }
  }, {
    sequelize,
    tableName: 'goals',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['employeeId'] },
      { fields: ['cycleId'] },
      { fields: ['status'] },
      { fields: ['type'] }
    ]
  });
}

export default { Goal, initGoalModel };
