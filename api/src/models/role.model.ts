import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface RoleAttributes {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  permissions: any;
  dataScope: 'all' | 'department' | 'self';
  level: number;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: string;
  public tenantId!: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public permissions!: any;
  public dataScope!: 'all' | 'department' | 'self';
  public level!: number;
  public status!: 'active' | 'inactive';
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initRoleModel(sequelize: Sequelize): void {
  Role.init({
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
      comment: '角色名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '角色编码'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '描述'
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      comment: '权限配置'
    },
    dataScope: {
      type: DataTypes.ENUM('all', 'department', 'self'),
      allowNull: false,
      defaultValue: 'self',
      comment: '数据范围：all-全部，department-部门，self-仅自己'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '角色等级（数字越小权限越高）'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    }
  }, {
    sequelize,
    tableName: 'roles',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['code'] },
      { fields: ['level'] }
    ]
  });
}

export default { Role, initRoleModel };
