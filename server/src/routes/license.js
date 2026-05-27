/**
 * Software License API Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Dynamic model loader
function getLicenseModel() {
  return require('../models/License');
}

function getUserModel() {
  return require('../models/User');
}

// Simple error logging
function logError(msg, err) {
  console.error('[License Error]', msg, err ? (err.message || String(err)) : 'unknown');
}

/**
 * Generate License (Admin)
 * POST /api/license/generate
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { deviceId, deviceName, type = 'standard', expiryDays = 365, features = ['basic'] } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }
    
    const License = getLicenseModel();
    const existingLicense = await License.findOne({ deviceId, isActive: true });
    if (existingLicense) {
      return res.status(400).json({ 
        error: 'Device already licensed',
        existingLicense: {
          licenseCode: existingLicense.licenseCode,
          expiryDate: existingLicense.expiryDate,
          type: existingLicense.type,
        }
      });
    }
    
    // Use a simple license code format
    const licenseCode = 'WINDV-' + deviceId.substring(0, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    
    const license = new License({
      licenseCode,
      deviceId,
      deviceName: deviceName || 'Unknown Device',
      type,
      features: Array.isArray(features) ? features : ['basic'],
      expiryDate: new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000),
      isActive: true,
      createdBy: req.user.id,
    });
    
    await license.save();
    console.log('[License] Generated:', licenseCode, 'for', deviceId);
    
    res.json({
      success: true,
      license: {
        licenseCode,
        deviceId,
        deviceName: license.deviceName,
        type,
        features: license.features,
        expiryDate: license.expiryDate,
        createdAt: license.createdAt,
      }
    });
  } catch (error) {
    logError('Generate license failed', error);
    res.status(500).json({ error: 'Failed to generate license' });
  }
});

/**
 * Verify License
 * POST /api/license/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { licenseCode, deviceId } = req.body;
    
    if (!licenseCode) {
      return res.status(400).json({ error: 'License code required', valid: false });
    }
    
    const License = getLicenseModel();
    
    if (!License) {
      console.error('[License] Model not loaded!');
      return res.status(500).json({ error: 'License model not loaded', valid: false });
    }
    
    console.log('[License] Looking for:', licenseCode);
    const license = await License.findOne({ licenseCode });
    console.log('[License] Found:', license ? license.licenseCode : 'null');
    
    if (!license) {
      return res.status(404).json({ valid: false, error: 'License not found' });
    }
    
    if (!license.isActive) {
      return res.status(403).json({ valid: false, error: 'License deactivated' });
    }
    
    if (new Date(license.expiryDate) < new Date()) {
      return res.status(403).json({ valid: false, error: 'License expired', expiryDate: license.expiryDate });
    }
    
    if (deviceId && license.deviceId && license.deviceId !== deviceId) {
      return res.status(403).json({ valid: false, error: 'Device mismatch' });
    }
    
    if (!license.deviceId && deviceId) {
      license.deviceId = deviceId;
      license.activatedAt = new Date();
      await license.save();
      console.log('[License] Activated:', licenseCode, 'for device', deviceId);
    }
    
    res.json({
      valid: true,
      license: {
        licenseCode: license.licenseCode,
        type: license.type,
        features: license.features,
        expiryDate: license.expiryDate,
        deviceId: license.deviceId,
        deviceName: license.deviceName,
      }
    });
  } catch (error) {
    logError('Verify license failed', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Get License List (Admin)
 * GET /api/license/list
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const License = getLicenseModel();
    const { page = 1, limit = 20, type, isActive, keyword } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (keyword) {
      query.$or = [
        { licenseCode: { $regex: keyword, $options: 'i' } },
        { deviceId: { $regex: keyword, $options: 'i' } },
        { deviceName: { $regex: keyword, $options: 'i' } },
      ];
    }
    
    const licenses = await License.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await License.countDocuments(query);
    
    const stats = {
      total: await License.countDocuments(),
      active: await License.countDocuments({ isActive: true }),
      expired: await License.countDocuments({ isActive: true, expiryDate: { $lt: new Date() } }),
    };
    
    res.json({
      licenses,
      stats,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    logError('Get license list failed', error);
    res.status(500).json({ error: 'Failed to get list' });
  }
});

/**
 * Get My Licenses
 * GET /api/license/my
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const License = getLicenseModel();
    const { deviceId } = req.query;
    
    const query = { createdBy: req.user.id, isActive: true };
    if (deviceId) query.deviceId = deviceId;
    
    const licenses = await License.find(query).sort({ createdAt: -1 });
    res.json({ licenses });
  } catch (error) {
    logError('Get my licenses failed', error);
    res.status(500).json({ error: 'Failed to get licenses' });
  }
});

/**
 * Revoke License (Admin)
 * DELETE /api/license/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const License = getLicenseModel();
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    license.isActive = false;
    license.deactivatedAt = new Date();
    await license.save();
    
    console.log('[License] Revoked:', license.licenseCode);
    res.json({ success: true, message: 'License revoked' });
  } catch (error) {
    logError('Revoke license failed', error);
    res.status(500).json({ error: 'Failed to revoke' });
  }
});

/**
 * Extend License (Admin)
 * POST /api/license/:id/extend
 */
router.post('/:id/extend', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const License = getLicenseModel();
    const { days = 365 } = req.body;
    
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    const currentExpiry = new Date(license.expiryDate);
    const newExpiry = new Date(currentExpiry.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);
    license.expiryDate = newExpiry;
    await license.save();
    
    console.log('[License] Extended:', license.licenseCode, 'to', newExpiry);
    res.json({ success: true, license: { licenseCode: license.licenseCode, expiryDate: license.expiryDate } });
  } catch (error) {
    logError('Extend license failed', error);
    res.status(500).json({ error: 'Failed to extend' });
  }
});

/**
 * Activate Trial
 * POST /api/license/trial
 */
router.post('/trial', async (req, res) => {
  try {
    const { deviceId, deviceName } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }
    
    const License = getLicenseModel();
    
    if (!License) {
      console.error('[Trial] Model not loaded!');
      return res.status(500).json({ error: 'License model not loaded' });
    }
    
    console.log('[Trial] Activating for device:', deviceId);
    
    const existingLicense = await License.findOne({ deviceId, isActive: true });
    if (existingLicense) {
      console.log('[Trial] Device already has license');
      return res.status(400).json({ error: 'Device already licensed' });
    }
    
    const trialHistory = await License.findOne({ deviceId, type: 'trial' });
    if (trialHistory) {
      console.log('[Trial] Trial already used');
      return res.status(400).json({ error: 'Trial already used' });
    }
    
    const licenseCode = 'TRIAL-' + deviceId.substring(0, 8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    
    const license = new License({
      licenseCode,
      deviceId,
      deviceName: deviceName || 'Trial Device',
      type: 'trial',
      features: ['basic', 'stats'],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      activatedAt: new Date(),
    });
    
    await license.save();
    console.log('[License] Trial activated:', licenseCode, 'for', deviceId);
    
    res.json({
      success: true,
      license: {
        licenseCode,
        type: 'trial',
        features: ['basic', 'stats'],
        expiryDate: license.expiryDate,
        daysLeft: 7,
      }
    });
  } catch (error) {
    logError('Activate trial failed', error);
    res.status(500).json({ error: 'Failed to activate trial' });
  }
});

/**
 * Check License Status
 * GET /api/license/check/:deviceId
 */
router.get('/check/:deviceId', async (req, res) => {
  try {
    const License = getLicenseModel();
    const { deviceId } = req.params;
    
    const license = await License.findOne({ deviceId, isActive: true });
    
    if (!license) {
      return res.json({
        licensed: false,
        canTrial: !(await License.exists({ deviceId, type: 'trial' })),
      });
    }
    
    const isExpired = new Date(license.expiryDate) < new Date();
    const daysLeft = Math.ceil((new Date(license.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    res.json({
      licensed: !isExpired,
      isExpired,
      daysLeft: isExpired ? 0 : daysLeft,
      license: {
        type: license.type,
        features: license.features,
        expiryDate: license.expiryDate,
      }
    });
  } catch (error) {
    logError('Check license failed', error);
    res.status(500).json({ error: 'Check failed' });
  }
});

module.exports = router;