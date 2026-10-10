import { randomUUID } from "node:crypto";
import { normalizeUserIdKey, type Learner, type LearnerInput } from "../../shared/learner";
import { collections } from "../db/mongo";
import { mapLearner } from "./mappers";

const DUPLICATE_KEY_CODE = 11000;

export async function createLearner(input: LearnerInput): Promise<Learner | "exists"> {
  const doc = {
    _id: randomUUID(),
    userId: input.userId,
    userIdKey: normalizeUserIdKey(input.userId),
    name: input.name,
    createdAt: new Date(),
  };
  try {
    await collections.learners().insertOne(doc);
  } catch (error) {
    if ((error as { code?: number }).code === DUPLICATE_KEY_CODE) return "exists";
    throw error;
  }
  return mapLearner(doc);
}

export async function findLearnerByUserId(userId: string): Promise<Learner | null> {
  const doc = await collections.learners().findOne({ userIdKey: normalizeUserIdKey(userId) });
  return doc ? mapLearner(doc) : null;
}

export async function learnerExists(id: string): Promise<boolean> {
  const doc = await collections.learners().findOne({ _id: id }, { projection: { _id: 1 } });
  return doc !== null;
}
