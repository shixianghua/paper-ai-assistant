import mongoose, { Document as MongoDocument, Schema } from 'mongoose';

export interface IDocument extends MongoDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: 'generate' | 'rewrite';
  status: 'draft' | 'completed';
  metadata: {
    wordCount?: number;
    similarity?: number;
    topic?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['generate', 'rewrite'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'draft',
    },
    metadata: {
      wordCount: Number,
      similarity: Number,
      topic: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IDocument>('Document', documentSchema);
