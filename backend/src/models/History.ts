import mongoose, { Document, Schema } from 'mongoose';

export interface IHistory extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  documentId?: mongoose.Types.ObjectId;
  timestamp: Date;
  metadata: any;
}

const historySchema = new Schema<IHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false,
  }
);

export default mongoose.model<IHistory>('History', historySchema);
