import mongoose, { Document, Schema } from 'mongoose';

export interface ServiceModel extends Document {
  tenant: string;
  read: { apiKey: string; ips: string[] };
  write: { apiKey: string; ips: string[] };
  mailTo: string;
}

// schema
const ServiceSchema = new Schema({
  tenant: { type: String, index: true },
  read: { apiKey: { type: String, unique: true }, ips: [String] },
  write: { apiKey: { type: String, unique: true }, ips: [String] },
  mailTo: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ServiceModel>('Service', ServiceSchema);
