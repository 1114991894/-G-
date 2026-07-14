import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ServerNotificationAttributes {
  id: string;
  type: 'trial' | 'system' | 'approval' | 'alert';
  title: string;
  content: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServerNotificationCreationAttributes extends Optional<ServerNotificationAttributes, 'id' | 'read' | 'createdAt' | 'updatedAt'> {}

export class ServerNotification extends Model<ServerNotificationAttributes, ServerNotificationCreationAttributes> implements ServerNotificationAttributes {
  public id!: string;
  public type!: 'trial' | 'system' | 'approval' | 'alert';
  public title!: string;
  public content!: string;
  public read!: boolean;
  public data?: Record<string, any>;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initServerNotificationModel(sequelize: Sequelize): void {
  ServerNotification.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('trial', 'system', 'approval', 'alert'),
      allowNull: false,
      defaultValue: 'system',
      comment: '通知类型'
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '内容'
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否已读'
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '附加数据'
    }
  }, {
    sequelize,
    tableName: 'server_notifications',
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['read'] },
      { fields: ['createdAt'] }
    ]
  });
}

export default { ServerNotification, initServerNotificationModel };