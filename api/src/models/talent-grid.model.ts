import { DataTypes, Sequelize, Model } from 'sequelize';

export interface TalentGridAttributes {
  id?: string;
  tenantId: string;
  cycleId: string;
  employeeId: string;
  performanceScore?: number;
  potentialScore?: number;
  gridPosition?: 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';
  quadrant?: 'star' | 'core' | 'professional' | 'potential' | 'solid' | 'basic' | 'improve' | 'risk' | 'out';
  comments?: string;
  createdBy?: string;
  updatedBy?: string;
}

export class TalentGrid extends Model<TalentGridAttributes> implements TalentGridAttributes {
  public id!: string;
  public tenantId!: string;
  public cycleId!: string;
  public employeeId!: string;
  public performanceScore?: number;
  public potentialScore?: number;
  public gridPosition?: 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';
  public quadrant?: 'star' | 'core' | 'professional' | 'potential' | 'solid' | 'basic' | 'improve' | 'risk' | 'out';
  public comments?: string;
  public createdBy?: string;
  public updatedBy?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize): typeof TalentGrid => {
  TalentGrid.init({
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
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '员工ID',
    },
    performanceScore: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '绩效得分',
    },
    potentialScore: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '潜力得分',
    },
    gridPosition: {
      type: DataTypes.ENUM('A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'),
      comment: '九宫格位置',
    },
    quadrant: {
      type: DataTypes.ENUM('star', 'core', 'professional', 'potential', 'solid', 'basic', 'improve', 'risk', 'out'),
      comment: '人才象限',
    },
    comments: {
      type: DataTypes.TEXT,
      comment: '评语',
    },
    createdBy: {
      type: DataTypes.UUID,
    },
    updatedBy: {
      type: DataTypes.UUID,
    },
  }, {
    sequelize,
    tableName: 'talent_grids',
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'cycleId', 'employeeId'],
      },
    ],
  });

  return TalentGrid;
};
