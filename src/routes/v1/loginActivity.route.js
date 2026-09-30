const express = require('express');
const auth = require('../../middlewares/auth');
const { loginActivityController } = require('../../controllers');

const router = express.Router();

router.route('/').get(auth(), loginActivityController.getLoginActivities);

module.exports = router;
