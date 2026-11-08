import type { User, Interview, Question, Answer, Evaluation } from './types';
import dbConnect from './mongoose';
import UserModel from './models/User';
import InterviewModel from './models/Interview';
import QuestionModel from './models/Question';
import AnswerModel from './models/Answer';
import EvaluationModel from './models/Evaluation';

// Helper to reliably transform Mongoose documents into plain types
function serializeDoc<T>(doc: any): T {
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  return obj as unknown as T;
}

// USER OPERATIONS
export async function createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  await dbConnect();

  // Custom check to match previous error throwing logic
  const existing = await UserModel.findOne({ email: data.email });
  if (existing) throw new Error('User already exists');

  const user = await UserModel.create(data);
  return serializeDoc<User>(user);
}

export async function verifyUser(email: string, password?: string): Promise<User> {
  await dbConnect();
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("Account not found. You have not signed up with this email yet. Please create an account first.");
  if (user.password !== password) throw new Error("Incorrect password. Please try again.");
  return serializeDoc<User>(user);
}

export async function getOrCreateUser(email: string, name: string): Promise<User> {
  await dbConnect();
  let user = await UserModel.findOne({ email });
  if (!user) {
    user = await UserModel.create({ email, name });
  }
  return serializeDoc<User>(user);
}

export async function getUserById(userId: string): Promise<User | null> {
  await dbConnect();
  const user = await UserModel.findById(userId);
  return user ? serializeDoc<User>(user) : null;
}

export async function getAllUsers(): Promise<User[]> {
  await dbConnect();
  const users = await UserModel.find({});
  return users.map(u => serializeDoc<User>(u));
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  await dbConnect();
  const user = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
  return user ? serializeDoc<User>(user) : null;
}

export async function deleteUser(userId: string): Promise<boolean> {
  await dbConnect();
  
  // 1. Find all interviews for this user
  const interviews = await InterviewModel.find({ userId });
  const interviewIds = interviews.map(i => i._id);

  // 2. Find all questions for these interviews
  const questions = await QuestionModel.find({ interviewId: { $in: interviewIds } });
  const questionIds = questions.map(q => q._id);

  // 3. Find all answers for these questions
  const answers = await AnswerModel.find({ questionId: { $in: questionIds } });
  const answerIds = answers.map(a => a._id);

  // 4. Delete everything in reverse order (bottom-up for safety/integrity)
  await EvaluationModel.deleteMany({ answerId: { $in: answerIds } });
  await AnswerModel.deleteMany({ _id: { $in: answerIds } });
  await QuestionModel.deleteMany({ _id: { $in: questionIds } });
  await InterviewModel.deleteMany({ _id: { $in: interviewIds } });
  
  // 5. Finally delete the user
  const result = await UserModel.findByIdAndDelete(userId);
  
  return !!result;
}

// INTERVIEW OPERATIONS
export async function createInterview(userId: string, category: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<Interview> {
  await dbConnect();
  const interview = await InterviewModel.create({
    userId,
    category,
    difficulty,
  });
  return serializeDoc<Interview>(interview);
}

export async function getInterview(interviewId: string): Promise<Interview | null> {
  await dbConnect();
  const interview = await InterviewModel.findById(interviewId);
  return interview ? serializeDoc<Interview>(interview) : null;
}

export async function getUserInterviews(userId: string): Promise<Interview[]> {
  await dbConnect();
  const interviews = await InterviewModel.find({ userId });
  return interviews.map(i => serializeDoc<Interview>(i));
}

export async function updateInterview(interviewId: string, updates: Partial<Interview>): Promise<Interview | null> {
  await dbConnect();
  const interview = await InterviewModel.findByIdAndUpdate(interviewId, updates, { new: true });
  return interview ? serializeDoc<Interview>(interview) : null;
}

// QUESTION OPERATIONS
export async function createQuestions(interviewId: string, questions: Omit<Question, 'id' | 'interviewId'>[]): Promise<Question[]> {
  await dbConnect();
  const docs = questions.map((q, index) => ({
    ...q,
    interviewId,
    order: index,
  }));
  const created = await QuestionModel.insertMany(docs);
  return created.map(q => serializeDoc<Question>(q));
}

export async function getInterviewQuestions(interviewId: string): Promise<Question[]> {
  await dbConnect();
  const questions = await QuestionModel.find({ interviewId }).sort({ order: 1 });
  return questions.map(q => serializeDoc<Question>(q));
}

export async function getQuestion(questionId: string): Promise<Question | null> {
  await dbConnect();
  const question = await QuestionModel.findById(questionId);
  return question ? serializeDoc<Question>(question) : null;
}

// ANSWER OPERATIONS
export async function createAnswer(questionId: string, answerText: string, duration: number): Promise<Answer> {
  await dbConnect();
  const answer = await AnswerModel.create({
    questionId,
    answerText,
    wordCount: answerText.split(/\s+/).filter(Boolean).length,
    duration,
  });
  return serializeDoc<Answer>(answer);
}

export async function getAnswer(answerId: string): Promise<Answer | null> {
  await dbConnect();
  const answer = await AnswerModel.findById(answerId);
  return answer ? serializeDoc<Answer>(answer) : null;
}

export async function getQuestionAnswers(questionId: string): Promise<Answer[]> {
  await dbConnect();
  const answers = await AnswerModel.find({ questionId });
  return answers.map(a => serializeDoc<Answer>(a));
}

// EVALUATION OPERATIONS
export async function createEvaluation(answerId: string, evaluation: Omit<Evaluation, 'id' | 'evaluatedAt' | 'answerId'>): Promise<Evaluation> {
  await dbConnect();
  const newEvaluation = await EvaluationModel.create({
    ...evaluation,
    answerId,
  });
  return serializeDoc<Evaluation>(newEvaluation);
}

export async function getEvaluation(evaluationId: string): Promise<Evaluation | null> {
  await dbConnect();
  const evaluation = await EvaluationModel.findById(evaluationId);
  return evaluation ? serializeDoc<Evaluation>(evaluation) : null;
}

export async function getAnswerEvaluation(answerId: string): Promise<Evaluation | null> {
  await dbConnect();
  const evaluation = await EvaluationModel.findOne({ answerId });
  return evaluation ? serializeDoc<Evaluation>(evaluation) : null;
}

export async function getInterviewEvaluations(interviewId: string): Promise<Evaluation[]> {
  await dbConnect();
  const questions = await QuestionModel.find({ interviewId });
  const questionIds = questions.map(q => q._id);

  const answers = await AnswerModel.find({ questionId: { $in: questionIds } });
  const answerIds = answers.map(a => a._id);

  const evaluations = await EvaluationModel.find({ answerId: { $in: answerIds } });
  return evaluations.map(e => serializeDoc<Evaluation>(e));
}

// RESET (kept for signature compatibility but modified to do nothing/drop db safely if needed)
export async function resetDatabase() {
  await dbConnect();
  // Be careful with dropDatabase in production!
  // await mongoose.connection.db.dropDatabase();
  console.warn("resetDatabase called but ignored in Mongo implementation for safety.");
}
