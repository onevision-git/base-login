// File: src/models/User.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IUser extends Document {
  companyId: mongoose.Types.ObjectId;
  email: string;
  passwordHash?: string;
  password?: string;
  emailVerified: boolean;
  role: 'admin' | 'standard';
  isMaster?: boolean;
  passwordUpdatedAt?: Date;
  /** NEW: date/time of the most recent successful login (UTC); null until first login after this change */
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    password: {
      type: String,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['admin', 'standard'],
      default: 'standard',
    },
    isMaster: {
      type: Boolean,
      default: false,
    },
    passwordUpdatedAt: {
      type: Date,
      index: true,
    },
    // NEW FIELD: will be set on successful sign-in; defaults to null for existing users
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default User;
