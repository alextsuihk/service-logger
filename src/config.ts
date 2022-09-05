import fs from 'fs';
import merge from 'deepmerge';
import path from 'path';

import baseConfig from './env/base';

export interface Config {
  defaultPort: number;
  mongoDbUrl: string;
  apiKeyAdmin: string;

  defaultMailTo: string;
  smtp: {
    host: string;
    port: number;
    ssl: boolean;
    user: string;
    pass: string;
    senderName: string;
    senderEmail: string;
  };

  startTime: number;
  instance: string;
  pm2: string;
}

// merge default-setting & common config
let config: Partial<Config> = baseConfig;

// read NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';

// if NODE_ENV is defined
const extendFile = path.join(__dirname, 'env', `${nodeEnv}.${process.env.NODE_ENV === 'production' ? 'js' : 'ts'}`);

// if the "additional config file" exists, read in the json content
if (fs.existsSync(extendFile)) {
  const extendConfig = require(extendFile).default; // eslint-disable-line
  config = merge(config, extendConfig); // merge with environment-specific config
}

config.startTime = new Date().getTime(); // set when server start up
config.pm2 = process.env.NODE_APP_INSTANCE || 'X';
config.instance = `${nodeEnv}-${new Date().getTime().toString(36).substring(3)}-${config.pm2}`; // to identify instance

export default config as Config;
