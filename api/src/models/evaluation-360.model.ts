import { DataTypes, Sequelize, Model } from 'sequelize';

export interface Evaluation360Attributes {
  id?: string;
  tenantId: string;
  cycleId: string;
  evaluateeId: string;
  evaluatorId: string;
  evaluatorType: 'self' | 'peer' | 'subordinate' | 'superior' | 'customer';
  dimension: string;
  score?: number;
  comments?: string;
  status: 'pending' | 'completed';
  completedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class Evaluation360 extends Model<Evaluation360Attributes> implements Evaluation360Attributes {
  public id!: string;
  public tenantId!: string;
  public cycleId!: string;
  public evaluateeId!: string;
  public evaluatorId!: string;
  public evaluatorType!: 'self' | 'peer' | 'subordinate' | 'superior' | 'customer';
  public dimension!: string;
  public score?: number;
  public comments?: string;
  public status!: 'pending' | 'completed';
  public completedAt?: Date;
  public createdBy?: string;
  public updatedBy?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize): typeof Evaluation360 => {
  Evaluation360.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    cycleId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '绩效周期ID',
    },
    evaluateeId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '被评估人ID',
    },
    evaluatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '评估人ID',
    },
    evaluatorType: {
      type: DataTypes.ENUM('self', 'peer', 'subordinate', 'superior', 'customer'),
      allowNull: false,
      comment: '评估人类型：self-自评, peer-同事, subordinate-下属, superior-上级, customer-客户',
    },
    dimension: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '评价维度',
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '评分',
    },
    comments: {
      type: DataTypes.TEXT,
      comment: '评语',
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed'),
      defaultValue: 'pending',
    },
    completedAt: {
      type: DataTypes.DATE,
    },
    createdBy: {
      type: DataTypes.UUID,
    },
    updatedBy: {
      type: DataTypes.UUID,
    },
  }, {
    sequelize,
    tableName: 'evaluation_360s',
    indexes: [
      {
        fields: ['tenantId', 'cycleId', 'evaluateeId'],
      },
    ],
  });

  return Evaluation360;
};
