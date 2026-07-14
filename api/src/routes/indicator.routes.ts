import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { Request, Response } from 'express';
import { Indicator } from '../models';
import { Op } from 'sequelize';

const router = express.Router();

// 所有路由需要认证
router.use(authenticate);

/**
 * @route GET /api/v1/indicators
 * @desc 获取指标列表
 * @access Private
 */
router.get('/', authorize(['indicator:view']), async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, keyword, type, category, isTemplate } = req.query;
    const tenantId = (req as any).user?.tenantId;

    const where: any = { tenantId };
    
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (type) where.type = type;
    if (category) where.category = category;
    if (isTemplate !== undefined) where.isTemplate = isTemplate === 'true';

    const offset = (Number(page) - 1) * Number(pageSize);
    
    const { count, rows } = await Indicator.findAndCountAll({
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
    console.error('获取指标列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

/**
 * @route GET /api/v1/indicators/:id
 * @desc 获取指标详情
 * @access Private
 */
router.get('/:id', authorize(['indicator:view']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenantId;

    const indicator = await Indicator.findOne({
      where: { id, tenantId }
    });

    if (!indicator) {
      res.status(404).json({
        success: false,
        message: '指标不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: indicator
    });
  } catch (error) {
    console.error('获取指标详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

/**
 * @route POST /api/v1/indicators
 * @desc 创建指标
 * @access Private
 */
router.post('/', authorize(['indicator:create']), async (req: Request, res: Response) => {
  try {
    const { name, code, type, category, description, unit, calculationMethod, dataSource, targetValue, excellentValue, goodValue, passValue, weight, scoreType, isTemplate, templateCategory } = req.body;
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;

    const indicator = await Indicator.create({
      tenantId,
      name,
      code,
      type: type || 'quantitative',
      category,
      description,
      unit,
      calculationMethod,
      dataSource,
      targetValue,
      excellentValue,
      goodValue,
      passValue,
      weight: weight || 0,
      scoreType: scoreType || 'manual',
      isTemplate: isTemplate || false,
      templateCategory,
      status: 'active',
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      message: '创建成功',
      data: indicator
    });
  } catch (error) {
    console.error('创建指标失败:', error);
    res.status(500).json({
      success: false,
      message: '创建失败'
    });
  }
});

/**
 * @route PUT /api/v1/indicators/:id
 * @desc 更新指标
 * @access Private
 */
router.put('/:id', authorize(['indicator:edit']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, type, category, description, unit, calculationMethod, dataSource, targetValue, excellentValue, goodValue, passValue, weight, scoreType, isTemplate, templateCategory, status } = req.body;
    const tenantId = (req as any).user?.tenantId;

    const indicator = await Indicator.findOne({
      where: { id, tenantId }
    });

    if (!indicator) {
      res.status(404).json({
        success: false,
        message: '指标不存在'
      });
      return;
    }

    await indicator.update({
      name,
      code,
      type,
      category,
      description,
      unit,
      calculationMethod,
      dataSource,
      targetValue,
      excellentValue,
      goodValue,
      passValue,
      weight,
      scoreType,
      isTemplate,
      templateCategory,
      status
    });

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新指标失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

/**
 * @route DELETE /api/v1/indicators/:id
 * @desc 删除指标
 * @access Private
 */
router.delete('/:id', authorize(['indicator:delete']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenantId;

    const indicator = await Indicator.findOne({
      where: { id, tenantId }
    });

    if (!indicator) {
      res.status(404).json({
        success: false,
        message: '指标不存在'
      });
      return;
    }

    await indicator.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除指标失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
});

export default router;