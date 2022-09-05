import mongoose from 'mongoose';

import Service from './models/service';

export interface Service {
  tenant: string;
  read: { apiKey: string; ips: string[] };
  write: { apiKey: string; ips: string[] };
  mailTo: string;
}

let services: Service[] = [];

const load = (): Service[] => services;

const update = async (items?: Service[]): Promise<void> => {
  if (items) {
    services = items;
  } else {
    // wait until Mongoose is ready (primary for JEST)
    while (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    services = await Service.find();
    if (services.length === 0) console.log(`Database logger.service is empty, please seed service FIRST`); // eslint-disable-line
  }
};

export default { load, update };
