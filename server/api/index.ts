import { Router } from "express";
import ridesRouter from "./rides";

const router = Router();

// Mount the rides router
router.use("/rides", ridesRouter);

export default router;