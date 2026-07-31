import { Router } from 'express';
import { searchController } from './controller/search.controller.js';

const router = Router();

router.get('/search', searchController.globalSearch);

export default router;
