import 'dotenv/config';

import express from '../plugins/express';
import knowledgeRouter from './knowledge';
import adminRouter from './admin';
import conversationRouter from './conversation';
import configRouter from './config';

const router = express.Router();

// General Routes
router.use('/knowledge', knowledgeRouter);
router.use('/admin', adminRouter);
router.use('/conversation', conversationRouter);
router.use('/config', configRouter);

export default router;