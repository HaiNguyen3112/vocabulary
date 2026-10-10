import { Hono } from "hono";
import { parseLearnerInput } from "../../shared/learner";
import { parseReviewInput } from "../../shared/review";
import { collections } from "../db/mongo";
import { createLearner, findLearnerByUserId, learnerExists } from "../services/learners";
import { listReviews, recordReview } from "../services/reviews";

export const learnerRoutes = new Hono();

learnerRoutes.post("/", async (c) => {
  const parsed = parseLearnerInput(await c.req.json().catch(() => null));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  const learner = await createLearner(parsed.value);
  if (learner === "exists") return c.json({ error: "User ID already exists" }, 409);
  return c.json({ learner }, 201);
});

// Registered before /:learnerId routes so it is never captured by them.
learnerRoutes.get("/by-user-id/:userId", async (c) => {
  const learner = await findLearnerByUserId(c.req.param("userId"));
  return learner ? c.json({ learner }) : c.json({ error: "User ID not found" }, 404);
});

learnerRoutes.get("/:learnerId/reviews", async (c) => {
  const learnerId = c.req.param("learnerId");
  if (!(await learnerExists(learnerId))) return c.json({ error: "Learner not found" }, 404);
  return c.json({ reviews: await listReviews(learnerId) });
});

learnerRoutes.post("/:learnerId/reviews", async (c) => {
  const learnerId = c.req.param("learnerId");
  const parsed = parseReviewInput(await c.req.json().catch(() => null));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  if (!(await learnerExists(learnerId))) return c.json({ error: "Learner not found" }, 404);
  const word = await collections
    .words()
    .findOne({ _id: parsed.value.wordId }, { projection: { _id: 1 } });
  if (!word) return c.json({ error: "Word not found" }, 404);

  const { wordId, rating } = parsed.value;
  return c.json({ review: await recordReview(learnerId, wordId, rating) });
});
