import nodemailer from 'nodemailer';
import os from 'os';

// custom modules
import config from './config';

// models
import { LogModel } from './models/log';

const {
  defaultMailTo,
  smtp: { host, port, ssl, user, pass, senderName, senderEmail },
} = config;

const transporter = nodemailer.createTransport({ host, port, secure: ssl, auth: { user, pass } });

/**
 * Send Log Report Email
 * @param logs
 * @param subject
 * @param title
 * @param mailTo
 */
const reportEmail = async (logs: LogModel[], subject: string, title: string, mailTo?: string): Promise<void> => {
  const tableContent = logs.map(
    log => `
    <tr>
      <td>${log.tenant}</td>
      <td>${log.level}</td>
      <td>${log.ip}</td>
      <td>${log.user ?? log.instance ?? 'No Info'}</td>     
      <td>${log.userAgent}</td>
      <td>${log.msg}</td>
      <td>${log.createdAt.toLocaleString()}</td>
    </tr>
  `,
  );

  const html = `
    <html>
      <head>
        <style>
        table {
          font-family: arial, sans-serif;
          border-collapse: collapse;
          width: 100%;
        }

        td, th {
          border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;
        }

        tr:nth-child(even) {
          background-color: #dddddd;
        }
        </style>
      </head>
      <body><center>
        <h1>Logger Report ${title}</h1><br>

        <table>
          <tr>
            <th>tenant</th>
            <th>level</th>
            <th>ip</th>
            <th>PM2/React</th>
            <th>userAgent</th>
            <th>message</th>
            <th>timestamp</th>
          </tr>
          ${tableContent}
        </table>

        <h4>This is computer-generated report, do NOT reply to this email address </h4>

      </center></body>
    </html>
  `;

  const message = {
    from: `"${senderName}" <${senderEmail}>`,
    to: mailTo?.split(',')?.join() || defaultMailTo, // use default if not happy with the queryString format
    subject: `Logger Report: ${subject}`,
    html,
    // attachments: 'TODO: attach excel file, considering using npm xlsx'
  };

  await transporter.sendMail(message);
};

/**
 * Send a Startup Email to default recipient(s)
 */
const startupEmail = async (): Promise<void> => {
  const message = {
    from: `"${senderName}" <${senderEmail}>`,
    to: defaultMailTo,
    subject: `Logger ${config.instance} Server starts up`,
    html: `
      <strong>Logger Report Server starts up @ ${new Date().toLocaleString()} </strong><br>
      startTime: ${new Date(config.startTime)} <br>
      pm2: ${config.pm2} <br>
      instance: ${config.instance} <br>
      cpu: ${os.cpus()[0].model} <br>
      docker host: ${os.hostname()}<br>
      `,
  };

  await transporter.sendMail(message);
};

export { reportEmail, startupEmail };
