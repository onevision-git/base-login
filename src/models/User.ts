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
  },
  { timestamps: true },
);

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default User;
