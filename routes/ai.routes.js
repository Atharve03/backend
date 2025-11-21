const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.get('/predict-player/:playerId', aiController.predictPlayerPerformance);
router.post('/recommend-team-xi', aiController.recommendTeamXI);
router.get('/detect-anomalies/:matchId/:inningsId', aiController.detectMatchAnomalies);
router.get('/insights', aiController.getAIInsights);

module.exports = router;  // ✅ IMPORTANT!
