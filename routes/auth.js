const express = require('express');

const router = express.Router();

const authController = require('../src/controllers/authController');

router.post('/cadastro', authController.cadastro);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

router.get('/me', authController.me);

module.exports = router;