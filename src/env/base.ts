/**
 * Common Configuration
 *
 * store system basic configuration regardless of environment (dev, prod, etc)
 *
 */

const config = {
  defaultPort: 4000,

  mongoDbUrl: 'mongodb+srv://dev:alextsui@cluster0.anfem.mongodb.net/logger?retryWrites=true&w=majority',

  apiKeyAdmin: 'a-super-key', // super key: able to read any log

  defaultMailTo: 'report@alextsui.net, alex.w.tsui@gmail.com',
  smtp: {
    host: 'smtp.example.com',
    port: 465,
    ssl: true, // true for 465, false for other ports
    user: 'username@example.com',
    pass: 'somePassword',
    senderName: 'Sender Friendly Name',
    senderEmail: 'sender@example.com',
  },
};

export default config;
