import mongoose from 'mongoose';

const { Schema } = mongoose;

export type InviteStatus = 'PENDING' | 'ACCEPTED';

const InviteSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true, // (not unique) allows multiple attempts over time
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED'],
      default: 'PENDING',
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invitedAt: {
      type: Date,
      default: () => new Date(),
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Re-use model if already compiled (Next.js hot reload)
const Invite = mongoose.models.Invite || mongoose.model('Invite', InviteSchema);
export default Invite;
