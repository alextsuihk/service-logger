/* eslint-disable @typescript-eslint/no-var-requires  */
/* eslint-disable no-console */

import chalk from 'chalk';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';

// custom modules
import config from '../config';

// models
import Service, { ServiceModel } from '../models/service';

const sync = async (argv: string[]): Promise<void> => {
  try {
    const mongooseOptions = {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    };
    await mongoose.connect(config.mongoDbUrl, mongooseOptions);

    console.log('------------------------------------------------------------ ');
    console.log(`Mongoose has connected to ${config.mongoDbUrl}`);

    // drop database
    if (argv.includes('--drop')) {
      console.log('------------------------------------------------------------ ');

      try {
        await mongoose.connection.dropCollection('services');
        console.log(chalk.red('"services" collections are dropped !!! \n'));
      } catch (error) {
        console.error(chalk.red('ERROR in Drop Collections'), error.message);
        throw `Error in Drop Collections`;
      }
    }

    // Seed initial collection
    if (argv.includes('--seed')) {
      console.log('------------------------------------------------------------ ');

      try {
        const jsonFile = path.join(__dirname, 'services.json');
        if (fs.existsSync(jsonFile)) {
          const services = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
          await Service.create(services as ServiceModel[]);
          console.log(chalk.green(`Seeding >>> Completed \n`));
        } else {
          console.log(`
          Seeding Date File is NOT found (/services/services.json). \n
          Please copy /services/services.sample.json to /services/services.json \n\n
          Application is terminated !! \n
          `);
          process.exit(1); // eslint-disable-line no-process-exit
        }
      } catch (error) {
        console.error(`ERROR in seeding: `, error);
        throw `Error in Seeding`;
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error(chalk.red('\n\nSeeding FAIL ....................', error, '\n\n'));
    await mongoose.connection.close();
    throw error;
  }
};

// For command line operation, pass in arguments
const argv = process.argv.slice(2); // pass in arguments, remove 1st two element
if (argv) {
  sync(argv)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default sync;
