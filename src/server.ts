import mongoose from 'mongoose';
import schedule from 'node-schedule';

// custom modules
import app from './app';
import config from './config';
import { reportEmail, startupEmail } from './sendmail';
import serviceLoader from './service-loader';

// models
import Log from './models/log';

const { defaultPort } = config;
const port = process.env.PORT ? parseInt(process.env.PORT) : defaultPort;

const server = app.listen(port, '0.0.0.0', async () => {
  // eslint-disable-next-line no-console
  console.log(`Log Server [${config.instance}] started on ${port} '0.0.0.0', @ ${new Date().toString()}`);

  mongoose.connection.once('open', () => {
    // Setup Schedule crontab: email report hourly from 7am to 11pm
    schedule.scheduleJob('7 7-23 * * *', async () => {
      const services = serviceLoader.load();
      services.forEach(async service => {
        const { tenant, mailTo } = service;
        const logs = await Log.find({ tenant, readAt: undefined }).sort({ createdAt: 'desc' });

        if (app.get('env') === 'production' && logs.length > 0) {
          await Log.updateMany({ tenant, readAt: undefined }, { readAt: new Date() }); // mark read
          const subject = `unread log of ${tenant}`;
          const title = `[Unread Log of ${tenant} @ ${new Date()}]`;
          await reportEmail(logs, subject, title, mailTo);
        }
      });
    });

    process.send && process.send('ready'); // send message to PM2

    // eslint-disable-next-line no-console
    console.log(`Log Server [${config.instance}] mongoose connected successfully`);

    if (app.get('env') === 'production') startupEmail(); // send an startup email
  });
});

/**
 * Graceful shutdown
 */
const shutdown = async (): Promise<void> => {
  mongoose.disconnect(() => {
    server.close(() => {
      console.log(`Log Server [${config.instance}] shuts down @ ${new Date().toString()}`); // eslint-disable-line no-console

      process.exit(0);
    });
  });

  await new Promise(resolve => setTimeout(resolve, 2000));
  process.exit(1);
};

/**
 * Process End Event
 * gracefully shutdown, closing database(s) connection pools
 */
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown); // PM2 stop signal
