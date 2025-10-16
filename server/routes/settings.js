const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { auth } = require('../middleware/auth');

// @route   GET api/settings
// @desc    Get all settings
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/settings/:key
// @desc    Get a specific setting by key
// @access  Public (or Private depending on sensitivity)
router.get('/:key', async (req, res) => {
    try {
      const setting = await Setting.findOne({ key: req.params.key });
      if (!setting) {
        return res.status(404).json({ msg: 'Setting not found' });
      }
      res.json(setting);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// @route   POST api/settings
// @desc    Create or update a setting
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
  const { key, value, name, description } = req.body;

  try {
    let setting = await Setting.findOne({ key });

    if (setting) {
      // Update
      setting.value = value;
      if (name) setting.name = name;
      if (description) setting.description = description;
    } else {
      // Create
      setting = new Setting({ key, value, name, description });
    }

    await setting.save();
    res.json(setting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
