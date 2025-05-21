import { Router } from "express";
import ridesRouter from "./rides";
import usersRouter from "./users";

const router = Router();

// Mount the rides router
router.use("/rides", ridesRouter);

// Mount the users router
router.use("/users", usersRouter);

export default router;