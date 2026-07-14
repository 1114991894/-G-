import { Request, Response } from 'express';
import { Goal, Employee, PerformanceCycle } from '../models';
import { Op } from 'sequelize';

export class GoalController {
  /**
   * 获取目标列表
   */
  async getGoals(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, keyword, cycleId, employeeId, status, type } = req.query;
      const tenantId = (req as any).user?.tenantId;

      const where: any = { tenantId };
      
      if (keyword) {
        where[Op.or] = [
          { title: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ];
      }
      
      if (cycleId) where.cycleId = cycleId;
      if (employeeId) where.employeeId = employeeId;
      if (status) where.status = status;
      if (type) where.type = type;

      const userRole = (req as any).role;
      if (userRole?.dataScope === 'self') {
        const employeeId = (req as any).user?.employeeId;
        if (employeeId) {
          where.employeeId = employeeId;
        }
      }

      const offset = (Number(page) - 1) * Number(pageSize);
      
      const { count, rows } = await Goal.findAndCountAll({
        where,
        include: [
          { model: Employee, as: 'employee' },
          { model: PerformanceCycle, as: 'cycle' }
        ],
        limit: Number(pageSize),
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          list: rows,
          total: count,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      });
    } catch (error) {
      console.error('获取目标列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 获取目标详情
   */
  async getGoalById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const goal = await Goal.findOne({
        where: { id, tenantId },
        include: [
          { model: Employee, as: 'employee' },
          { model: PerformanceCycle, as: 'cycle' },
          { model: Goal, as: 'parentGoal' }
        ]
      });

      if (!goal) {
        res.status(404).json({
          success: false,
          message: '目标不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: goal
      });
    } catch (error) {
      console.error('获取目标详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 创建目标
   */
  async createGoal(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, type, priority, targetValue, unit, startDate, endDate, weight, cycleId } = req.body;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      const employeeId = (req as any).user?.employeeId;
      if (!employeeId) {
        res.status(400).json({
          success: false,
          message: '员工信息不存在'
        });
        return;
      }

      const goal = await Goal.create({
        tenantId,
        employeeId,
        cycleId,
        title,
        description,
        type,
        priority: priority || 'medium',
        targetValue,
        unit,
        startDate,
        endDate,
        weight: weight || 0,
        status: 'draft',
        progress: 0,
        createdBy: userId,
        updatedBy: userId
      });

      res.status(201).json({
        success: true,
        message: '创建成功',
        data: goal
      });
    } catch (error) {
      console.error('创建目标失败:', error);
      res.status(500).json({
        success: false,
        message: '创建失败'
      });
    }
  }

  /**
   * 更新目标
   */
  async updateGoal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, priority, targetValue, currentValue, unit, startDate, endDate, weight, progress } = req.body;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      const goal = await Goal.findOne({
        where: { id, tenantId }
      });

      if (!goal) {
        res.status(404).json({
          success: false,
          message: '目标不存在'
        });
        return;
      }

      // 更新目标
      await goal.update({
        title,
        description,
        priority,
        targetValue,
        currentValue,
        unit,
        startDate,
        endDate,
        weight,
        progress,
        updatedBy: userId
      });

      res.json({
        success: true,
        message: '更新成功'
      });
    } catch (error) {
      console.error('更新目标失败:', error);
      res.status(500).json({
        success: false,
        message: '更新失败'
      });
    }
  }

  /**
   * 删除目标
   */
  async deleteGoal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const goal = await Goal.findOne({
        where: { id, tenantId }
      });

      if (!goal) {
        res.status(404).json({
          success: false,
          message: '目标不存在'
        });
        return;
      }

      // 删除目标
      await goal.destroy();

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除目标失败:', error);
      res.status(500).json({
        success: false,
        message: '删除失败'
      });
    }
  }

  /**
   * 提交目标审批
   */
  async submitGoal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const goal = await Goal.findOne({
        where: { id, tenantId }
      });

      if (!goal) {
        res.status(404).json({
          success: false,
          message: '目标不存在'
        });
        return;
      }

      if (goal.status !== 'draft') {
        res.status(400).json({
          success: false,
          message: '只有草稿状态的目标才能提交'
        });
        return;
      }

      // 更新状态
      await goal.update({ status: 'submitted' });

      res.json({
        success: true,
        message: '提交成功'
      });
    } catch (error) {
      console.error('提交目标失败:', error);
      res.status(500).json({
        success: false,
        message: '提交失败'
      });
    }
  }

  /**
   * 审批目标
   */
  async approveGoal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const goal = await Goal.findOne({
        where: { id, tenantId }
      });

      if (!goal) {
        res.status(404).json({
          success: false,
          message: '目标不存在'
        });
        return;
      }

      if (goal.status !== 'submitted') {
        res.status(400).json({
          success: false,
          message: '只有已提交的目标才能审批'
        });
        return;
      }

      // 更新状态
      await goal.update({ status: 'approved' });

      res.json({
        success: true,
        message: '审批通过'
      });
    } catch (error) {
      console.error('审批目标失败:', error);
      res.status(500).json({
        success: false,
        message: '审批失败'
      });
    }
  }

  /**
   * 驳回目标
   */
  async rejectGoal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { feedback } = req.body;
      const tenantId = (req as any).user?.tenantId;

      const goal = await Goal.findOne({
        where: { id, tenantId }
      });

      if (!goal) {
        res.status(404).json({
          success: false,
          message: '目标不存在'
        });
        return;
      }

      if (goal.status !== 'submitted') {
        res.status(400).json({
          success: false,
          message: '只有已提交的目标才能驳回'
        });
        return;
      }

      // 更新状态
      await goal.update({ 
        status: 'rejected',
        feedback
      });

      res.json({
        success: true,
        message: '已驳回'
      });
    } catch (error) {
      console.error('驳回目标失败:', error);
      res.status(500).json({
        success: false,
        message: '驳回失败'
      });
    }
  }
}

export default GoalController;
