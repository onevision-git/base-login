import mongoose, { Document, Model, Schema } from 'mongoose';

export type InviteStatus = 'PENDING' | 'ACCEPTED';

export interface IInvite extends Document {
  companyId: mongoose.Types.ObjectId;
  email: string;
  status: InviteStatus;
  invitedBy: mongoose.Types.ObjectId;
  invitedAt: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
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
      index: true, // not unique, allows multiple invites over time
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

const Invite: Model<IInvite> =
  mongoose.models.Invite || mongoose.model<IInvite>('Invite', InviteSchema);

export default Invite;
