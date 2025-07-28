// packages/auth/src/models/User.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  tenantId: string;
  email: string;
  passwordHash: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['user'] },
  },
  { timestamps: true },
);

const User = model<IUser>('User', UserSchema);
export default User;
