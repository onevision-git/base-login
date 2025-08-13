import mongoose, { Document, Model } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  domain: string;
  maxUsers: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new mongoose.Schema<ICompany>(
  {
    name: { type: String, required: true },
    domain: { type: String, unique: true, required: true },
    maxUsers: { type: Number, default: 3 },
  },
  { timestamps: true },
);

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
