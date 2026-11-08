import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
    interviewId: string;
    questionText: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    order: number;
    hints?: string[];
}

const QuestionSchema: Schema = new Schema({
    interviewId: { type: String, required: true },
    questionText: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    order: { type: Number, required: true },
    hints: [{ type: String }],
});

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
