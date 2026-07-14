import express from 'express';
import { ServerAdmin, TrialApplication, ServerNotification, SharedEmployee, Tenant } from '../models';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.get('/clients', async (req, res) => {
  try {
    const tenants = await Tenant.findAll({ where: { type: 'client' } });
    const clients = tenants.map(t => ({
      id: t.id,
      name: t.name,
      contactName: t.contactName || '',
      phone: t.contactPhone || '',
      password: '',
      status: t.status === 'trial' ? 'trial' : t.status,
      employeeCount: t.currentEmployees || 0,
      employeeEnabledCount: t.currentEmployees || 0,
      employeeDisabledCount: 0,
      createdAt: t.createdAt?.toISOString() || '',
      region: '',
      province: '',
      city: '',
      scale: t.scale || '',
      assignedTo: '',
      assignedToName: '',
      assignedAt: '',
      disableReason: '',
      disabledAt: '',
      disabledBy: '',
      expireDate: t.trialEndDate?.toISOString() || '',
      lastLogin: '',
      healthScore: 100
    }));
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/clients', async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      res.json({ success: true, data: req.body });
    } else {
      const client = req.body;
      const existing = await Tenant.findOne({ where: { name: client.name } });
      if (!existing) {
        await Tenant.create({
          id: client.id,
          name: client.name,
          type: 'client',
          status: client.status === 'trial' ? 'trial' : 'active',
          scale: client.scale,
          contactName: client.contactName,
          contactPhone: client.phone,
          trialEndDate: client.expireDate ? new Date(client.expireDate) : undefined,
          currentEmployees: client.employeeCount
        });
      }
      res.json({ success: true, data: client });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/clients', async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    await Tenant.update({
      status: updates.status === 'trial' ? 'trial' : updates.status,
      scale: updates.scale,
      contactName: updates.contactName,
      contactPhone: updates.phone,
      trialEndDate: updates.expireDate ? new Date(updates.expireDate) : undefined,
      currentEmployees: updates.employeeCount
    }, { where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.delete('/clients', async (req, res) => {
  try {
    const id = req.query.id as string;
    if (id) {
      await Tenant.destroy({ where: { id } });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/trial-applications', async (req, res) => {
  try {
    const apps = await TrialApplication.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: apps });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/trial-applications', async (req, res) => {
  try {
    const app = await TrialApplication.create({
      ...req.body,
      submittedAt: new Date()
    });
    res.json({ success: true, data: app });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/trial-applications', async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    await TrialApplication.update({
      ...updates,
      reviewedAt: new Date()
    }, { where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const notifications = await ServerNotification.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const notification = await ServerNotification.create(req.body);
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/notifications', async (req, res) => {
  try {
    const { id } = req.body;
    await ServerNotification.update({ read: true }, { where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/admins', async (req, res) => {
  try {
    const admins = await ServerAdmin.findAll();
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/admins', async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      for (const admin of req.body) {
        const existing = await ServerAdmin.findOne({ where: { username: admin.username } });
        if (!existing) {
          await ServerAdmin.create({
            ...admin,
            password: bcrypt.hashSync(admin.password, 10)
          });
        }
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/employees', async (req, res) => {
  try {
    const employees = await SharedEmployee.findAll();
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const employee = await SharedEmployee.create({
      ...req.body,
      password: bcrypt.hashSync(req.body.password, 10)
    });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/employees', async (req, res) => {
  try {
    const { key, ...updates } = req.body;
    if (updates.password) {
      updates.password = bcrypt.hashSync(updates.password, 10);
    }
    await SharedEmployee.update(updates, { where: { key } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.delete('/employees', async (req, res) => {
  try {
    const key = req.query.key as string;
    if (key) {
      await SharedEmployee.destroy({ where: { key } });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;