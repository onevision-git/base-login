// src/models/Settings.ts
import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';
import { connect } from '@/lib/db';

/**
 * Singleton settings doc keyed as _id = "global".
 * Stores platform-wide configuration knobs.
 */
const SettingsSchema = new Schema(
  {
    _id: { type: String, default: 'global' }, // fixed id for singleton
    defaultInviteUsers: {
      type: Number,
      default: 3,
      min: 0,
      max: 1000, // guardrail; adjust later if needed
    },
    // audit-ish metadata
    updatedBy: { type: String }, // email of the updater
  },
  { timestamps: true },
);

// Avoid model overwrite in dev
export type SettingsDoc = InferSchemaType<typeof SettingsSchema>;
export type SettingsModel = Model<SettingsDoc>;

export const Settings: SettingsModel =
  (mongoose.models.Settings as SettingsModel) ||
  mongoose.model<SettingsDoc, SettingsModel>('Settings', SettingsSchema);

/**
 * Ensure the singleton exists and return it.
 */
export async function getSettings(): Promise<SettingsDoc> {
  await connect();
  const existing = await Settings.findById('global').lean<SettingsDoc>().exec();
  if (existing) return existing;

  // create with defaults
  await Settings.create({ _id: 'global' });

  // lean() drops virtuals/methods; we only store primitives here
  const fresh = await Settings.findById('global').lean<SettingsDoc>().exec();
  if (!fresh) {
    throw new Error('Failed to initialise global settings');
  }
  return fresh;
}

/**
 * Update selected fields on the singleton settings doc.
 */
export async function updateSettings(
  patch: Partial<Pick<SettingsDoc, 'defaultInviteUsers' | 'updatedBy'>>,
): Promise<SettingsDoc> {
  await connect();
  await Settings.updateOne(
    { _id: 'global' },
    { $set: patch },
    { upsert: true },
  ).exec();

  const updated = await Settings.findById('global').lean<SettingsDoc>().exec();
  if (!updated) {
    throw new Error('Failed to update global settings');
  }
  return updated;
}
