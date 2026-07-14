import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ServerAdminAttributes {
  id: string;
  username: string;
  realName: string;
  phone: string;
  password: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServerAdminCreationAttributes extends Optional<ServerAdminAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class ServerAdmin extends Model<ServerAdminAttributes, ServerAdminCreationAttributes> implements ServerAdminAttributes {
  public id!: string;
  public username!: string;
  public realName!: string;
  public phone!: string;
  public password!: string;
  public role!: string;
  public permissions!: string[];
  public status!: 'active' | 'inactive';
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initServerAdminModel(sequelize: Sequelize): void {
  ServerAdmin.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名'
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '真实姓名'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '手机号'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码（加密）'
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'admin',
      comment: '角色'
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: '权限列表'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态'
    }
  }, {
    sequelize,
    tableName: 'server_admins',
    timestamps: true,
    indexes: [
      { fields: ['username'], unique: true },
      { fields: ['phone'] },
      { fields: ['status'] }
    ]
  });
}

export default { ServerAdmin, initServerAdminModel };