// packages/auth/src/models/Tenant.ts

import { Schema, model, Document } from 'mongoose';

export interface TenantDoc extends Document {
  name: string;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<TenantDoc>(
  {
    name: { type: String, required: true },
    domain: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export default model<TenantDoc>('Tenant', TenantSchema);
