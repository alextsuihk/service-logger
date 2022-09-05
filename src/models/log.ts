import mongoose, { Document, Schema } from 'mongoose';

export interface LogModel extends Document {
  tenant: string;
  instance: string;
  level: string;
  ip: string;

  pm2: string;

  user: string;
  userAgent: string;
  mobileDetect: unknown; // let keep it flexible
  sysInfo: unknown; // let keep it flexible

  msg: string;
  extra: unknown; // we don't process nor care the detailed format
  url: string;

  createdAt: Date;
  readAt: Date;
}

// schema
const LogSchema = new Schema({
  tenant: { type: String, index: true }, // key to identify sender
  instance: { type: String, required: true }, // a hash to identify service's instance or client's session
  level: String,
  ip: String, // remote IP

  // primary for multiple PM2 instance (e.g. Express server)
  pm2: String, // PM2 process.env.NODE_APP_INSTANCE

  // React client specific
  user: String, // React user.id
  userAgent: String,
  mobileDetect: Schema.Types.Mixed,
  sysInfo: Schema.Types.Mixed,

  msg: String,
  extra: Schema.Types.Mixed, // extra message object
  url: String, // optional: indicate URL having problem

  createdAt: { type: Date, default: Date.now, index: { expires: '400d' } }, // auto deletion

  readAt: Date,
});

export default mongoose.model<LogModel>('Log', LogSchema);
