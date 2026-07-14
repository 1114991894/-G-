import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface TrialApplicationAttributes {
  id: string;
  ticketNo: string;
  companyName: string;
  contactName: string;
  phone: string;
  employeeCount: string;
  region: string;
  status: 'pending' | 'approved' | 'rejected';
  remark?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TrialApplicationCreationAttributes extends Optional<TrialApplicationAttributes, 'id' | 'status' | 'submittedAt' | 'createdAt' | 'updatedAt'> {}

export class TrialApplication extends Model<TrialApplicationAttributes, TrialApplicationCreationAttributes> implements TrialApplicationAttributes {
  public id!: string;
  public ticketNo!: string;
  public companyName!: string;
  public contactName!: string;
  public phone!: string;
  public employeeCount!: string;
  public region!: string;
  public status!: 'pending' | 'approved' | 'rejected';
  public remark?: string;
  public submittedAt?: Date;
  public reviewedAt?: Date;
  public reviewedBy?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTrialApplicationModel(sequelize: Sequelize): void {
  TrialApplication.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ticketNo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      comment: '申请单号'
    },
    companyName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '公司名称'
    },
    contactName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '联系人姓名'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '联系人电话'
    },
    employeeCount: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '员工数量'
    },
    region: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '区域'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '状态'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '提交时间'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '审核时间'
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '审核人ID'
    }
  }, {
    sequelize,
    tableName: 'trial_applications',
    timestamps: true,
    indexes: [
      { fields: ['ticketNo'], unique: true },
      { fields: ['status'] },
      { fields: ['submittedAt'] }
    ]
  });
}

export default { TrialApplication, initTrialApplicationModel };