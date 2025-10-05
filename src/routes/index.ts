import 'dotenv/config';

import express from '../plugins/express';
import knowledgeRouter from './knowledge';
import adminRouter from './admin';
import conversationRouter from './conversation';


const router = express.Router();

// Debug route to test if main router is working
router.get('/debug', (req, res) => {
    res.json({
        message: 'Main API router is working',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        routes: {
            knowledge: '/api/knowledge',
            admin: '/api/admin',
            conversation: '/api/conversation'
        }
    });
});

// General Routes
router.use('/knowledge', knowledgeRouter);
router.use('/admin', adminRouter);
router.use('/conversation', conversationRouter);

export default router;