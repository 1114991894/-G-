import { DataTypes, Sequelize, Model } from 'sequelize';

export interface CompetencyAttributes {
  id?: string;
  tenantId: string;
  name: string;
  description?: string;
  category: 'leadership' | 'professional' | 'generic';
  behaviors?: any;
  weight?: number;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export class Competency extends Model<CompetencyAttributes> implements CompetencyAttributes {
  public id!: string;
  public tenantId!: string;
  public name!: string;
  public description?: string;
  public category!: 'leadership' | 'professional' | 'generic';
  public behaviors?: any;
  public weight?: number;
  public isActive!: boolean;
  public createdBy?: string;
  public updatedBy?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize): typeof Competency => {
  Competency.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '胜任力名称',
    },
    description: {
      type: DataTypes.TEXT,
      comment: '描述',
    },
    category: {
      type: DataTypes.ENUM('leadership', 'professional', 'generic'),
      allowNull: false,
      comment: '分类：leadership-领导力, professional-专业力, generic-通用力',
    },
    behaviors: {
      type: DataTypes.JSON,
      comment: '行为描述（各级别行为标准）',
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '权重',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.UUID,
    },
    updatedBy: {
      type: DataTypes.UUID,
    },
  }, {
    sequelize,
    tableName: 'competencies',
    indexes: [
      {
        fields: ['tenantId', 'category'],
      },
    ],
  });

  return Competency;
};
