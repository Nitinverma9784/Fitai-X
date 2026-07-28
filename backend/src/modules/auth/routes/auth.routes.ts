import { Router } from 'express';
import { getGoogleUrl } from '../controllers/googleUrl.controller';
import { googleCallback } from '../controllers/googleCallback.controller';
import { googleVerify } from '../controllers/googleVerify.controller';
import { signup } from '../controllers/signup.controller';
import { login } from '../controllers/login.controller';

const router = Router();

router.get('/google/url', getGoogleUrl);
router.get('/google/callback', googleCallback);
router.post('/google/verify', googleVerify);
router.post('/signup', signup);
router.post('/login', login);

export default router;
