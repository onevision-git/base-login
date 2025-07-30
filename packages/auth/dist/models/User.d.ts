import { Document, Types } from 'mongoose';
export interface UserDoc extends Document {
  tenantId: Types.ObjectId;
  email: string;
  passwordHash: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}
declare const _default: import('mongoose').Model<
  UserDoc,
  {},
  {},
  {},
  Document<unknown, {}, UserDoc, {}> &
    UserDoc &
    Required<{
      _id: unknown;
    }> & {
      __v: number;
    },
  any
>;
export default _default;
//# sourceMappingURL=User.d.ts.map
