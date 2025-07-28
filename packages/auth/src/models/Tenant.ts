// packages/auth/src/models/Tenant.ts
import { Schema, model, Document } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, unique: true },
    domain: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

const Tenant = model<ITenant>('Tenant', TenantSchema);
export default Tenant;
