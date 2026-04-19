import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import trucksRouter from "./trucks";
import loadsRouter from "./loads";
import bidsRouter from "./bids";
import analyticsRouter from "./analytics";
import chatRouter from "./chat";
import routesRouter from "./routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(trucksRouter);
router.use(loadsRouter);
router.use(bidsRouter);
router.use(analyticsRouter);
router.use(chatRouter);
router.use(routesRouter);

export default router;
