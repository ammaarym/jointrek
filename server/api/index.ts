import { Router } from "express";
import ridesRouter from "./rides";
import usersRouter from "./users";
import userRidesRouter from "./user-rides";

const router = Router();

// Mount the rides router
router.use("/rides", ridesRouter);

// Mount the users router
router.use("/users", usersRouter);

// Mount the user rides router
router.use("/user-rides", userRidesRouter);

export default router;