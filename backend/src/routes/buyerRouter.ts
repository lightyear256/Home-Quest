import { Router } from "express";
import { addBuyer, Buyers, delete_buyer, update_buyer, update_buyer_status,history, getTotalClients} from "../controller/buyerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
export const buyerRouter=Router();
buyerRouter.use(authMiddleware);
buyerRouter.post("/add_buyers",addBuyer);
buyerRouter.get("/buyer",Buyers)
buyerRouter.delete("/delete",delete_buyer);
buyerRouter.put("/update_status",update_buyer_status);
buyerRouter.put("/update_buyer",update_buyer);
buyerRouter.get("/history",history);
buyerRouter.get("/get_count",getTotalClients);
buyerRouter.put('/edit/:id',update_buyer);
