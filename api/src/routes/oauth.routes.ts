import express from 'express';
import { OAuthController } from '../controllers/oauth.controller';

const router = express.Router();
const oauthController = new OAuthController();

router.get('/:platform/auth-url', oauthController.getAuthUrl.bind(oauthController));

router.post('/login', oauthController.oauthLogin.bind(oauthController));

router.post('/register-tenant', oauthController.registerTenant.bind(oauthController));

export default router;
