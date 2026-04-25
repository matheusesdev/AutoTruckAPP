const express = require('express');
const router = express.Router();
const controller = require('./services.controller');

router.get('/slots-disponiveis', controller.getSlots);
router.post('/', controller.create);
router.get('/', controller.list);

module.exports = router;ss