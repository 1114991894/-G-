import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface NotificationAttributes {
  id: string;
  tenantId: string;
  userId: string;
  senderId?: string;
  type: 'system' | 'performance' | 'goal' | 'approval' | 'reminder' | 'announcement';
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead' | 'priority' | 'createdAt' | 'updatedAt'> {}

export class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: string;
  public tenantId!: string;
  public userId!: string;
  public senderId?: string;
  public type!: 'system' | 'performance' | 'goal' | 'approval' | 'reminder' | 'announcement';
  public title!: string;
  public content!: string;
  public link?: string;
  public isRead!: boolean;
  public readAt?: Date;
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public channels!: string[];
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initNotificationModel(sequelize: Sequelize): void {
  Notification.init({
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '接收用户ID'
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '发送人ID'
    },
    type: {
      type: DataTypes.ENUM('system', 'performance', 'goal', 'approval', 'reminder', 'announcement'),
      allowNull: false,
      comment: '通知类型'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '内容'
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '链接'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否已读'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '读取时间'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
      comment: '优先级'
    },
    channels: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ['in_app'],
      comment: '推送渠道'
    }
  }, {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['userId'] },
      { fields: ['isRead'] },
      { fields: ['type'] },
      { fields: ['createdAt'] }
    ]
  });
}

export default { Notification, initNotificationModel };
