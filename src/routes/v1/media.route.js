const express = require('express');
const auth = require('../../middlewares/auth');
const { feedController } = require('../../controllers');

const router = express.Router();

router.get('/company/:companyId', auth(), feedController.getMediaPostsByCompany);
router.get('/:userId', auth(), feedController.getMediaPostsByUser);

module.exports = router;
