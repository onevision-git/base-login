import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      unique: true,
      required: true,
    },
    maxUsers: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true },
);

const Company =
  mongoose.models.Company || mongoose.model('Company', CompanySchema);
export default Company;
