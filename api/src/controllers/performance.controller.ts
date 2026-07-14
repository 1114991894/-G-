import { Request, Response } from 'express';
import { PerformanceCycle, Score, Goal, Employee } from '../models';

export class PerformanceController {
  /**
   * 获取绩效周期列表
   */
  async getCycles(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, status, type } = req.query;
      const tenantId = (req as any).user?.tenantId;

      const where: any = { tenantId };
      
      if (status) where.status = status;
      if (type) where.type = type;

      const offset = (Number(page) - 1) * Number(pageSize);
      
      const { count, rows } = await PerformanceCycle.findAndCountAll({
        where,
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
      console.error('获取绩效周期列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 创建绩效周期
   */
  async createCycle(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, startDate, endDate, description, config } = req.body;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      // 创建绩效周期
      const cycle = await PerformanceCycle.create({
        tenantId,
        name,
        type,
        startDate,
        endDate,
        description,
        config,
        status: 'draft',
        createdBy: userId
      });

      res.status(201).json({
        success: true,
        message: '创建成功',
        data: cycle
      });
    } catch (error) {
      console.error('创建绩效周期失败:', error);
      res.status(500).json({
        success: false,
        message: '创建失败'
      });
    }
  }

  /**
   * 获取绩效周期详情
   */
  async getCycleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const cycle = await PerformanceCycle.findOne({
        where: { id, tenantId }
      });

      if (!cycle) {
        res.status(404).json({
          success: false,
          message: '绩效周期不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: cycle
      });
    } catch (error) {
      console.error('获取绩效周期详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 更新绩效周期
   */
  async updateCycle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, type, startDate, endDate, description, config, status } = req.body;
      const tenantId = (req as any).user?.tenantId;

      const cycle = await PerformanceCycle.findOne({
        where: { id, tenantId }
      });

      if (!cycle) {
        res.status(404).json({
          success: false,
          message: '绩效周期不存在'
        });
        return;
      }

      // 更新绩效周期
      await cycle.update({
        name,
        type,
        startDate,
        endDate,
        description,
        config,
        status
      });

      res.json({
        success: true,
        message: '更新成功'
      });
    } catch (error) {
      console.error('更新绩效周期失败:', error);
      res.status(500).json({
        success: false,
        message: '更新失败'
      });
    }
  }

  /**
   * 激活绩效周期
   */
  async activateCycle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = (req as any).user?.tenantId;

      const cycle = await PerformanceCycle.findOne({
        where: { id, tenantId }
      });

      if (!cycle) {
        res.status(404).json({
          success: false,
          message: '绩效周期不存在'
        });
        return;
      }

      if (cycle.status !== 'draft') {
        res.status(400).json({
          success: false,
          message: '只有草稿状态的周期才能激活'
        });
        return;
      }

      // 更新状态
      await cycle.update({ status: 'active' });

      res.json({
        success: true,
        message: '激活成功'
      });
    } catch (error) {
      console.error('激活绩效周期失败:', error);
      res.status(500).json({
        success: false,
        message: '激活失败'
      });
    }
  }

  /**
   * 获取绩效看板
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId;

      const currentCycle = await PerformanceCycle.findOne({
        where: { tenantId, status: 'active' }
      });

      // 获取目标统计
      const goalStats = await Goal.findAndCountAll({
        where: { 
          tenantId, 
          cycleId: currentCycle?.id 
        }
      });

      // 获取员工绩效统计
      const employeeStats = await Score.findAndCountAll({
        where: { 
          tenantId, 
          cycleId: currentCycle?.id 
        }
      });

      res.json({
        success: true,
        data: {
          currentCycle,
          goalStats: {
            total: goalStats.count,
            draft: goalStats.rows.filter(g => g.status === 'draft').length,
            submitted: goalStats.rows.filter(g => g.status === 'submitted').length,
            approved: goalStats.rows.filter(g => g.status === 'approved').length
          },
          employeeStats: {
            total: employeeStats.count,
            scored: employeeStats.rows.filter(s => s.score !== null).length,
            pending: employeeStats.rows.filter(s => s.score === null).length
          }
        }
      });
    } catch (error) {
      console.error('获取绩效看板失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 获取评分列表
   */
  async getScores(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 20, cycleId, employeeId, status } = req.query;
      const tenantId = (req as any).user?.tenantId;

      const where: any = { tenantId };
      
      if (cycleId) where.cycleId = cycleId;
      if (employeeId) where.employeeId = employeeId;
      if (status) where.status = status;

      const offset = (Number(page) - 1) * Number(pageSize);
      
      const { count, rows } = await Score.findAndCountAll({
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
      console.error('获取评分列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取失败'
      });
    }
  }

  /**
   * 提交评分
   */
  async submitScore(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId, cycleId, indicatorId, goalId, score, comment, weight } = req.body;
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.id;

      // 创建评分
      const scoreRecord = await Score.create({
        tenantId,
        employeeId,
        cycleId,
        indicatorId,
        goalId,
        scorerId: userId,
        scorerType: 'manager',
        score,
        comment,
        weight: weight || 0,
        status: 'submitted',
        submittedAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: '评分提交成功',
        data: scoreRecord
      });
    } catch (error) {
      console.error('提交评分失败:', error);
      res.status(500).json({
        success: false,
        message: '提交失败'
      });
    }
  }
}

export default PerformanceController;
