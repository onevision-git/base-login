import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    isMaster: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['admin', 'standard'], default: 'standard' },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
