import mongoose, { Schema, Document } from 'mongoose';

export interface IInterview extends Document {
    userId: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    startTime: Date;
    endTime?: Date;
    overallScore?: number;
    status: 'active' | 'completed' | 'abandoned';
}

const InterviewSchema: Schema = new Schema({
    userId: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    overallScore: { type: Number },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
});

export default mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
