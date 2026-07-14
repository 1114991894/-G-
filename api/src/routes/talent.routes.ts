import { Router } from 'express';
import {
  getTalentGrid,
  generateTalentGrid,
  getEvaluations360,
  submitEvaluation360,
  getCompetencies,
  createCompetency,
  updateCompetency,
  deleteCompetency,
} from '../controllers/talent.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// 人才九宫格路由
router.get('/grid', authenticate, getTalentGrid);
router.post('/grid/generate', authenticate, authorize(['admin', 'hr']), generateTalentGrid);

// 360评价路由
router.get('/evaluations', authenticate, getEvaluations360);
router.post('/evaluations/:id/submit', authenticate, submitEvaluation360);

// 胜任力模型路由
router.get('/competencies', authenticate, getCompetencies);
router.post('/competencies', authenticate, authorize(['admin', 'hr']), createCompetency);
router.put('/competencies/:id', authenticate, authorize(['admin', 'hr']), updateCompetency);
router.delete('/competencies/:id', authenticate, authorize(['admin', 'hr']), deleteCompetency);

export default router;
