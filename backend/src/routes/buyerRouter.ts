import { Router } from "express";
import { addBuyer, Buyers, delete_buyer, update_buyer, update_buyer_status,history} from "../controller/buyerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { csvUploadMiddleware } from "../middleware/uploadMiddleware.js";
import { importBuyersCSV } from "../controller/ImportExportController.js";
export const buyerRouter=Router();
buyerRouter.use(authMiddleware);
buyerRouter.post("/add_buyers",addBuyer);
// buyerRouter.post('/import', authMiddleware, ...csvUploadMiddleware, importBuyersCSV);
buyerRouter.get("/buyer",Buyers)
// buyerRouter.get("/buyerWithId",BuyersWithId)
buyerRouter.delete("/delete",delete_buyer);
buyerRouter.put("/update_status",update_buyer_status)
buyerRouter.put("/update_buyer",update_buyer)
buyerRouter.get("/history",history)
