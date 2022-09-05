import { Request, Response, Router } from 'express';
import MobileDetect from 'mobile-detect';
// models
import Log, { LogModel } from '../models/log';
// custom modules
import { reportEmail } from '../sendmail';
import { verifyApiKey } from '../utils';

interface ReportQueryString {
  tenant?: string;
  begin?: string;
  end?: string;
  requestReport?: boolean;
}

interface FilterQuery {
  tenant?: string;
  createdAt?: { $gte?: Date; $lte?: Date };
}

const router = Router();

/**
 * @route   GET /
 * @desc    get all logs with options query (after, apiKey)
 * @access  with valid reporting api token
 */
router.get('/', async (req: Request, res: Response) => {
  const apiKeyHeader = req.get('x-api-key');

  const lastWeek = new Date().setDate(new Date().getDate() - 7);
  const { tenant: tenantQS, begin = lastWeek, end = new Date(), requestReport } = req.query as ReportQueryString;

  // get remote (client) IP address  (support NGINX reverse proxy)
  const ip =
    req.get('X-Forwarded-For') || req.get('X-Real-IP') || req.connection.remoteAddress || req.socket.remoteAddress;

  try {
    const { tenant, mailTo } = verifyApiKey('read', apiKeyHeader, ip, tenantQS);

    const beginDate = isNaN(new Date(begin).getTime()) ? new Date(lastWeek) : new Date(begin); // assume last week if QS is not a valid date
    const endDate = isNaN(new Date(`${end} 23:59:59`).getTime()) ? new Date() : new Date(`${end} 23:59:59`); // assume now if QS is not a valid date

    // construct query filter
    const filter = { tenant, createdAt: { $gte: beginDate, $lte: endDate } } as FilterQuery;

    const logs = await Log.find(filter).sort('-createdAt');

    if (requestReport) {
      // const title = `(${tenant || 'ALL'}) ${beginDate || 'beginning'} ~ ${endDate || 'now'}`;
      const subject = `unread log of ${tenant}`;
      const title = `[Unread Log of ${tenant}  ${beginDate.toLocaleString()} ~ ${endDate.toLocaleString()}]`;

      await reportEmail(logs, subject, title, mailTo);
      return res.status(200).json({ message: 'A copy of report is sent to designated mailbox', logs });
    }
    res.status(200).json({ logs });
  } catch (error) {
    if (error.kind) return res.status(500).json({ message: 'Internal Error' }); // Mongoose error
    res.status(401).json({ message: error });
  }
});

/**
 * @route   GET /:id
 * @desc    read a particular log message
 * @access  with valid x-api-key header
 */ router.get('/:id', async (req: Request, res: Response) => {
  const apiKeyHeader = req.get('x-api-key');
  const { id } = req.params;

  // get remote (client) IP address  (support NGINX reverse proxy)
  const ip =
    req.get('X-Forwarded-For') || req.get('X-Real-IP') || req.connection.remoteAddress || req.socket.remoteAddress;

  try {
    const { tenant } = verifyApiKey('read', apiKeyHeader, ip);

    const log = await Log.findOne({ _id: id, tenant });
    res.status(200).json(log);
  } catch (error) {
    if (error.kind) return res.status(500).json({ message: 'Internal Error' }); // Mongoose error
    res.status(401).json({ message: error });
  }
});

/**
 * @route   POST /
 * @desc    post a log message
 * @access  with valid x-api-key header
 */
router.post('/', async (req: Request, res: Response) => {
  const apiKeyHeader = req.get('x-api-key');

  // get remote (client) IP address  (support NGINX reverse proxy)
  const ip =
    req.get('X-Forwarded-For') || req.get('X-Real-IP') || req.connection.remoteAddress || req.socket.remoteAddress;

  const { instance = 'N/A', level, pm2, user, msg, extra, url } = req.body as LogModel;

  try {
    const { tenant } = verifyApiKey('write', apiKeyHeader, ip);

    const userAgent = req.get('user-agent'); // get user-agent

    // mobile browser detection
    const md = userAgent ? new MobileDetect(userAgent) : undefined;
    const mobileDetect = md
      ? {
          mobile: md.mobile(),
          phone: md.phone(),
          table: md.tablet(),
          userAgent: md.userAgent(),
          os: md.os(),
          isiPhone: md.is('iPhone'),
          isBot: md.is('bot'),
          versionWebkit: md.version('Webkit'),
          versionStr: md.versionStr('Build'),
          gameConsole: md.match('playstation|xbox'),
        }
      : {};

    const sysInfo = req.get('sys-info'); // system-information if available

    const log = await Log.create({
      tenant,
      instance,
      level,
      ip,
      pm2,
      user,
      userAgent,
      mobileDetect,
      sysInfo,
      msg,
      extra,
      url,
    } as LogModel);
    res.status(201).json({ message: 'Success', id: log.id });
  } catch (error) {
    if (error.kind) return res.status(500).json({ message: 'Internal Error' }); // Mongoose error
    res.status(401).json({ message: error });
  }
});

export default router;
