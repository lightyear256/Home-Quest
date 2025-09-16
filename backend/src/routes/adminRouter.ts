import { Router } from "express";
import { signin, signup } from "../controller/adminController.js";
import { exportBuyersCSV, getCSVTemplate, importBuyersCSV } from "../controller/ImportExportController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { csvUploadMiddleware } from "../middleware/uploadMiddleware.js";
import { delete_buyer, update_buyer, update_buyer_status } from "../controller/buyerController.js";
export const adminRouter=Router();
adminRouter.post("/signup",signup);
adminRouter.post("/signin",signin);
adminRouter.get("/csv_template",getCSVTemplate);
adminRouter.use(authMiddleware)
adminRouter.post('/import_csv',csvUploadMiddleware,importBuyersCSV);
adminRouter.get('/export',exportBuyersCSV);
