import express from 'express';
import { IntegrationController } from '../controllers/integration.controller';

const router = express.Router();
const integrationController = new IntegrationController();

router.get('/:tenantId/config', integrationController.getIntegrationConfig.bind(integrationController));
router.put('/:tenantId/config', integrationController.updateIntegrationConfig.bind(integrationController));
router.post('/:tenantId/toggle', integrationController.toggleIntegration.bind(integrationController));

export default router;
