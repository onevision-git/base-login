// packages/auth/src/models/User.ts
import { Schema, model } from 'mongoose';
const UserSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['user'] },
  },
  { timestamps: true },
);
export default model('User', UserSchema);
