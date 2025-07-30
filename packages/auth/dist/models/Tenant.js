// packages/auth/src/models/Tenant.ts
import { Schema, model } from 'mongoose';
const TenantSchema = new Schema(
  {
    name: { type: String, required: true },
    domain: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);
export default model('Tenant', TenantSchema);
