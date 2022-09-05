import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

// custom modules
import config from './config';
import serviceLoader from './service-loader';

// route files
import healthRoutes from './routes/health';
import logRoutes from './routes/log';
import serviceRoutes from './routes/service';

// Instantiate Express
const app = express();

// Connect to MongoDB
const mongooseOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
};

mongoose.connect(config.mongoDbUrl, mongooseOptions, () => {
  // read & update services[] once Mongoose is ready OR at re-connect
  serviceLoader.update();
  mongoose.connection.on('reconnected', serviceLoader.update);
});

app.use(helmet()); // ! Helmet should be the first middleware (wrapping around everything)
// app.disable('x-powered-by'); // hide response x-powered-by header (Helmet removes it already)

app.use(cors());

// Enable if you're behind a reverse proxy (NGINX)
// * see https://expressjs.com/en/guide/behind-proxies.html
if (app.get('env') === 'production' || app.get('env') === 'staging') app.set('trust proxy', true);

// Enable Morgan logger
if (app.get('env') === 'development') app.use(morgan('dev'));
// app.use(morgan('dev'));

// Configure Express rate limit
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 50, // limit each IP to 50 requests per windowMs
  }),
);

// Enable body parser middleware
app.use(express.json()); // for handling REST json

app.use('/api/health', healthRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/services', serviceRoutes);

app.use((_req: Request, res: Response) => {
  return res.status(404).json({ message: 'NOT FOUND' });
});

// Error Handler functions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.log('Error Handler: ', error); // eslint-disable-line no-console
  if (app.get('env') === 'production') return res.status(500).json({ message: 'Internal Error' });

  return res.status(500).json({ message: 'Internal Error', error });
});

export default app;
