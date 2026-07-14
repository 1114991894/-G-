import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ScoreAttributes {
  id: string;
  tenantId: string;
  employeeId: string;
  cycleId: string;
  indicatorId?: string;
  goalId?: string;
  scorerId: string;
  scorerType: 'self' | 'manager' | 'peer' | 'subordinate' | 'hr';
  score?: number;
  weight: number;
  comment?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  attachments?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScoreCreationAttributes extends Optional<ScoreAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Score extends Model<ScoreAttributes, ScoreCreationAttributes> implements ScoreAttributes {
  public id!: string;
  public tenantId!: string;
  public employeeId!: string;
  public cycleId!: string;
  public indicatorId?: string;
  public goalId?: string;
  public scorerId!: string;
  public scorerType!: 'self' | 'manager' | 'peer' | 'subordinate' | 'hr';
  public score?: number;
  public weight!: number;
  public comment?: string;
  public status!: 'draft' | 'submitted' | 'approved' | 'rejected';
  public submittedAt?: Date;
  public attachments?: any;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initScoreModel(sequelize: Sequelize): void {
  Score.init({
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
    indicatorId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '指标ID'
    },
    goalId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '目标ID'
    },
    scorerId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '评分人ID'
    },
    scorerType: {
      type: DataTypes.ENUM('self', 'manager', 'peer', 'subordinate', 'hr'),
      allowNull: false,
      comment: '评分人类型'
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '得分'
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '权重'
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '评语'
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '状态'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '提交时间'
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '附件'
    }
  }, {
    sequelize,
    tableName: 'scores',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['employeeId'] },
      { fields: ['cycleId'] },
      { fields: ['scorerId'] },
      { fields: ['status'] }
    ]
  });
}

export default { Score, initScoreModel };
