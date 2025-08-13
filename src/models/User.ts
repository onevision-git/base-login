// File: src/models/User.ts
import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IUser extends Document {
  companyId: mongoose.Types.ObjectId;
  email: string;
  passwordHash?: string; // deselected by default
  password?: string; // legacy field, deselected by default
  emailVerified: boolean;
  role: 'admin' | 'standard';
  passwordUpdatedAt?: Date; // <-- added, used to invalidate older JWTs
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
    // Mark as deselected; your route opts in via .select('+passwordHash')
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    // Optional legacy field if older rows used `password`
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
    // New field to track when the password last changed
    passwordUpdatedAt: {
      type: Date,
      index: true,
      // no default; will be set on reset or change
    },
  },
  { timestamps: true },
);

// Narrow BEFORE the || to avoid a union type on the model
const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default UserModel;
