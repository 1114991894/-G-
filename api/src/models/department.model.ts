import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface DepartmentAttributes {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  parentId: string | null;
  level: number;
  path: string;
  sortOrder: number;
  managerId: string | null;
  description?: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'level' | 'path' | 'sortOrder' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
  public id!: string;
  public tenantId!: string;
  public name!: string;
  public code!: string;
  public parentId!: string | null;
  public level!: number;
  public path!: string;
  public sortOrder!: number;
  public managerId!: string | null;
  public description?: string;
  public status!: 'active' | 'inactive';
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initDepartmentModel(sequelize: Sequelize): void {
  Department.init({
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
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '部门名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '部门编码'
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '父部门ID'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '层级'
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '部门路径（用于快速查询子树）'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序'
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '部门负责人ID'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '描述'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    }
  }, {
    sequelize,
    tableName: 'departments',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['parentId'] },
      { fields: ['code'] },
      { fields: ['status'] }
    ]
  });
}

export default { Department, initDepartmentModel };
