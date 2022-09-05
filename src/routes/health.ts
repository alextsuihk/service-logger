import { Router, Request, Response } from 'express';
import os from 'os';

// custom modules
import config from '../config';
import { verifyApiKey } from '../utils';

//  models
import Log from '../models/log';

const router = Router();

/**
 * @route   GET /health
 * @desc    request to send a log report
 * @access  require valid x-api-key
 */

router.get('/', async (req: Request, res: Response) => {
  const apiKeyHeader = req.get('x-api-key');

  const tenantQS = req.query.tenant as string | undefined;

  // get remote (client) IP address  (support NGINX reverse proxy)
  const ip =
    req.get('X-Forwarded-For') || req.get('X-Real-IP') || req.connection.remoteAddress || req.socket.remoteAddress;

  try {
    const { tenant } = verifyApiKey('read', apiKeyHeader, ip, tenantQS);

    // if isAdmin, service.tenant is undefined
    const lastDoc = await Log.findOne({ tenant }).sort('-createdAt');

    const used = process.memoryUsage();
    const memoryUsage = {
      rss: Math.round(used.rss / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      heapUsed: Math.round(used.heapUsed / 1024 / 1024),
      external: Math.round(used.external / 1024 / 1024),
      arrayBuffers: Math.round(used.external / 1024 / 1024),
    };

    return res.status(200).json({
      tenant,
      lastLogCreatedAt: lastDoc?.createdAt.toLocaleString() || 'No Record Found',
      startTime: new Date(config.startTime).toLocaleString(),
      appUpTime: Math.floor((new Date().getTime() - config.startTime) / 1000),
      nodeUpTime: Math.floor(process.uptime()),
      memoryUsage,
      freemem: Math.round(os.freemem() / 1024 / 1024),
    });
  } catch (error) {
    if (error.kind) return res.status(500).json({ message: 'Internal Error' }); // Mongoose error
    res.status(401).json({ message: error });
  }
});

export default router;
