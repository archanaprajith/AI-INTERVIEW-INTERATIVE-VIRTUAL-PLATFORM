import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
    questionId: string;
    answerText: string;
    audioUrl?: string;
    wordCount: number;
    duration: number; // in seconds
    submittedAt: Date;
}

const AnswerSchema: Schema = new Schema({
    questionId: { type: String, required: true },
    answerText: { type: String, required: true },
    audioUrl: { type: String },
    wordCount: { type: Number, required: true },
    duration: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema);
