// packages/auth/src/models/User.ts

import { Schema, model, Document, Types } from 'mongoose';

export interface UserDoc extends Document {
  tenantId: Types.ObjectId;
  email: string;
  passwordHash: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['user'] },
  },
  { timestamps: true },
);

export default model<UserDoc>('User', UserSchema);
