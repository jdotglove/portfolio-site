import 'dotenv/config';

import express from '../plugins/express';
import knowledgeRouter from './knowledge';
import adminRouter from './admin';
import conversationRouter from './conversation';


const router = express.Router();

// General Routes

router.use('/knowledge', knowledgeRouter);
router.use('/admin', adminRouter);
router.use('/conversation', conversationRouter);

export default router;