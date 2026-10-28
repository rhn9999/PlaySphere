import { Router } from 'express';
import authRoutes from './auth.routes.js';
import playerRoutes from './player.routes.js';
import venueRoutes from './venue.routes.js';
import slotRoutes from './slot.routes.js';
import bookingRoutes from './booking.routes.js';
import matchRoutes from './match.routes.js';
import socialRoutes from './social.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PlaySphere Platform API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Mounted Sub-routers
router.use('/auth', authRoutes);
router.use('/players', playerRoutes);
router.use('/venues', venueRoutes);
router.use('/slots', slotRoutes);
router.use('/bookings', bookingRoutes);
router.use('/matches', matchRoutes);
router.use('/social', socialRoutes);
router.use('/admin', adminRoutes);

export default router;
