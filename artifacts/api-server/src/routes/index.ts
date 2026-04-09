import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(propertiesRouter);
router.use(adminRouter);

export default router;
