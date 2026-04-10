import { Router } from "express";
import { db, newsletterSubscribersTable } from "@workspace/db";

const router = Router();

router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const { firstName, lastName, email } = req.body;

  if (!firstName || !lastName || !email) {
    res.status(400).json({ error: "First name, last name and email are required." });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Please provide a valid email address." });
    return;
  }

  try {
    await db.insert(newsletterSubscribersTable).values({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
    });
    res.json({ success: true, message: "Thank you for subscribing!" });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      res.status(409).json({ error: "This email is already subscribed." });
      return;
    }
    console.error("Newsletter subscribe error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

export default router;
