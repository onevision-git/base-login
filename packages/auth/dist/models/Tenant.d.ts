import { Document } from 'mongoose';
export interface TenantDoc extends Document {
  name: string;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
}
declare const _default: import('mongoose').Model<
  TenantDoc,
  {},
  {},
  {},
  Document<unknown, {}, TenantDoc, {}> &
    TenantDoc &
    Required<{
      _id: unknown;
    }> & {
      __v: number;
    },
  any
>;
export default _default;
//# sourceMappingURL=Tenant.d.ts.map
