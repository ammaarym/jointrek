import { Router } from "express";
import ridesRouter from "./rides";
import usersRouter from "./users";
import userRidesRouter from "./user-rides";
import gasPriceRouter from "./gas-price";
import idVerificationRouter from "./id-verification";

const router = Router();

// Mount the rides router
router.use("/rides", ridesRouter);

// Mount the users router
router.use("/users", usersRouter);

// Mount the user rides router
router.use("/user-rides", userRidesRouter);

// Mount the gas price router
router.use("/gas-price", gasPriceRouter);

// Mount the ID verification router
router.use("/id-verification", idVerificationRouter);

export default router;