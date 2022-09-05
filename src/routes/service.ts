import { Request, Response, Router } from 'express';

// custom modules
import config from '../config';
import serviceLoader from '../service-loader';

// models
import Service, { ServiceModel } from '../models/service';

const { apiKeyAdmin } = config;

const router = Router();

/**
 * @route   GET /
 * @desc    show all available service
 * @access  with valid reporting api token
 */
router.get('/', async (req: Request, res: Response) => {
  if (req.get('x-api-key') !== apiKeyAdmin) return res.status(401).json({ message: 'Access Denied' });

  try {
    const services = await Service.find();
    serviceLoader.update(services); // update services settings
    res.status(200).json({ services });
  } catch (error) {
    res.status(500).json({ message: 'Internal Error' });
  }
});

/**
 * @route   POST /
 * @desc    add a new tenant service
 * @access  with valid x-api-key header
 */
router.post('/', async (req: Request, res: Response) => {
  if (req.get('x-api-key') !== apiKeyAdmin) return res.status(401).json({ message: 'Access Denied' });

  const service = req.body as ServiceModel;

  const { tenant, read, write } = service;
  if (!tenant || !read || !read.apiKey || !read.ips.length || !write || !write.apiKey || !write.ips.length)
    return res.status(422).json({ message: 'Malformed Data' });

  try {
    const found = await Service.findOne({ tenant: service.tenant });
    if (found) return res.status(400).json({ message: 'Domain already exists' });

    const created = await Service.create(service);
    res.status(201).json({ message: 'Success', tenant: created.tenant });
  } catch (error) {
    res.status(500).json({ message: 'Internal Error' });
  }
});

/**
 * @route   delete /
 * @desc    delete a new tenant service
 * @access  with valid x-api-key header
 */
router.delete('/:tenant', async (req: Request, res: Response) => {
  if (req.get('x-api-key') !== apiKeyAdmin) return res.status(401).json({ message: 'Access Denied' });

  const { tenant } = req.params as { tenant: string };
  try {
    await Service.deleteOne({ tenant });
    res.status(200).json({ message: 'Success', tenant });
  } catch (error) {
    res.status(500).json({ message: 'Internal Error' });
  }
});

export default router;
