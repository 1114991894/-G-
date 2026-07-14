import { Request, Response } from 'express';
import { TalentGrid, Evaluation360, Competency, Employee } from '../models';

// 获取人才九宫格数据
export const getTalentGrid = async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.query;
    const tenantId = (req as any).user.tenantId;

    const where: any = { tenantId };
    if (cycleId) {
      where.cycleId = cycleId;
    }

    const grids = await TalentGrid.findAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'position', 'departmentId'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // 按象限分组统计
    const quadrantStats = {
      star: grids.filter(g => g.quadrant === 'star').length,
      core: grids.filter(g => g.quadrant === 'core').length,
      professional: grids.filter(g => g.quadrant === 'professional').length,
      potential: grids.filter(g => g.quadrant === 'potential').length,
      solid: grids.filter(g => g.quadrant === 'solid').length,
      basic: grids.filter(g => g.quadrant === 'basic').length,
      improve: grids.filter(g => g.quadrant === 'improve').length,
      risk: grids.filter(g => g.quadrant === 'risk').length,
      out: grids.filter(g => g.quadrant === 'out').length,
    };

    res.json({
      success: true,
      data: {
        grids,
        stats: quadrantStats,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 生成/更新人才九宫格
export const generateTalentGrid = async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.body;
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id;

    // 获取周期内所有员工的绩效得分
    const employees = await Employee.findAll({
      where: { tenantId, status: 'active' },
    });

    const results = [];
    for (const employee of employees) {
      // 这里应该根据实际业务逻辑计算绩效得分和潜力得分
      // 简化处理：随机生成示例数据
      const performanceScore = Math.random() * 5;
      const potentialScore = Math.random() * 5;

      let gridPosition: 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';
      let quadrant: 'star' | 'core' | 'professional' | 'potential' | 'solid' | 'basic' | 'improve' | 'risk' | 'out';

      if (performanceScore >= 4 && potentialScore >= 4) {
        gridPosition = 'A1';
        quadrant = 'star';
      } else if (performanceScore >= 4 && potentialScore >= 3) {
        gridPosition = 'A2';
        quadrant = 'core';
      } else if (performanceScore >= 4) {
        gridPosition = 'A3';
        quadrant = 'professional';
      } else if (performanceScore >= 3 && potentialScore >= 4) {
        gridPosition = 'B1';
        quadrant = 'potential';
      } else if (performanceScore >= 3) {
        gridPosition = 'B2';
        quadrant = 'solid';
      } else if (performanceScore >= 2) {
        gridPosition = 'B3';
        quadrant = 'basic';
      } else if (potentialScore >= 3) {
        gridPosition = 'C1';
        quadrant = 'improve';
      } else if (potentialScore >= 2) {
        gridPosition = 'C2';
        quadrant = 'risk';
      } else {
        gridPosition = 'C3';
        quadrant = 'out';
      }

      // 创建或更新九宫格数据
      const [grid, created] = await TalentGrid.findOrCreate({
        where: {
          tenantId,
          cycleId,
          employeeId: employee.id,
        },
        defaults: {
          tenantId,
          cycleId,
          employeeId: employee.id,
          performanceScore,
          potentialScore,
          gridPosition,
          quadrant,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      if (!created) {
        await grid.update({
          performanceScore,
          potentialScore,
          gridPosition,
          quadrant,
          updatedBy: userId,
        });
      }

      results.push(grid);
    }

    res.json({
      success: true,
      message: '人才九宫格生成成功',
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 获取360评价列表
export const getEvaluations360 = async (req: Request, res: Response) => {
  try {
    const { cycleId, evaluateeId, evaluatorType } = req.query;
    const tenantId = (req as any).user.tenantId;

    const where: any = { tenantId };
    if (cycleId) where.cycleId = cycleId;
    if (evaluateeId) where.evaluateeId = evaluateeId;
    if (evaluatorType) where.evaluatorType = evaluatorType;

    const evaluations = await Evaluation360.findAll({
      where,
      include: [
        {
          model: Employee,
          as: 'evaluatee',
          attributes: ['id', 'name', 'position'],
        },
        {
          model: Employee,
          as: 'evaluator',
          attributes: ['id', 'name', 'position'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: evaluations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const submitEvaluation360 = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { score, comments } = req.body;
    const userId = (req as any).user.id;

    const evaluation = await Evaluation360.findOne({
      where: { id, tenantId: (req as any).user.tenantId },
    });

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: '评价记录不存在',
      });
    }

    await evaluation.update({
      score,
      comments,
      status: 'completed',
      completedAt: new Date(),
      updatedBy: userId,
    });

    return res.json({
      success: true,
      message: '评价提交成功',
      data: evaluation,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 获取胜任力模型列表
export const getCompetencies = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const tenantId = (req as any).user.tenantId;

    const where: any = { tenantId, isActive: true };
    if (category) where.category = category;

    const competencies = await Competency.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']],
    });

    res.json({
      success: true,
      data: competencies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 创建胜任力模型
export const createCompetency = async (req: Request, res: Response) => {
  try {
    const { name, description, category, behaviors, weight } = req.body;
    const tenantId = (req as any).user.tenantId;
    const userId = (req as any).user.id;

    const competency = await Competency.create({
      tenantId,
      name,
      description,
      category,
      behaviors,
      weight,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: '胜任力模型创建成功',
      data: competency,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCompetency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, behaviors, weight, isActive } = req.body;
    const userId = (req as any).user.id;

    const competency = await Competency.findOne({
      where: { id, tenantId: (req as any).user.tenantId },
    });

    if (!competency) {
      return res.status(404).json({
        success: false,
        message: '胜任力模型不存在',
      });
    }

    await competency.update({
      name,
      description,
      category,
      behaviors,
      weight,
      isActive,
      updatedBy: userId,
    });

    return res.json({
      success: true,
      message: '胜任力模型更新成功',
      data: competency,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCompetency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const competency = await Competency.findOne({
      where: { id, tenantId: (req as any).user.tenantId },
    });

    if (!competency) {
      return res.status(404).json({
        success: false,
        message: '胜任力模型不存在',
      });
    }

    await competency.update({ isActive: false });

    return res.json({
      success: true,
      message: '胜任力模型删除成功',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
