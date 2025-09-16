import type { Response} from "express";
import { Client } from "../config/db.js";
import z from "zod";
import type { AuthenticatorRequest } from "../middleware/authMiddleware.js";

export const BuyerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15),
  city: z.enum(["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]),
  propertyType: z.enum(["Apartment", "Villa", "Plot", "Office", "Retail"]),
  bhk: z.enum(["One", "Two", "Three", "Four"]).optional(),
  purpose: z.enum(["Buy", "Rent"]),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  timeline: z.enum(["ZeroToThree", "ThreeToSix", "MoreThanSix", "Exploring"]),
  source: z.enum(["Website", "Referral", "WalkIn", "Call", "Other"]),
  status: z
    .enum([
      "New",
      "Qualified",
      "Contacted",
      "Visited",
      "Negotiation",
      "Converted",
      "Dropped",
    ])
    .default("New"),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).default([]),
  
});

export async function delete_buyer(req: AuthenticatorRequest, res: Response) {
  try {
    const id = req.body.id;
    const senderId = req.user?.id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Buyer ID is required",
      });
    }

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found",
      });
    }
    const existingBuyer = await Client.buyer.findFirst({
      where: {
        id,
        ownerId: senderId,
      },
    });

    if (!existingBuyer) {
      return res.status(404).json({
        success: false,
        message:
          "Buyer not found or you don't have permission to delete this buyer",
      });
    }

    await Client.buyerHistory.create({
      data: {
        buyerId: id,
        changedBy: senderId,
        changedAt: new Date(),
        diff: {
          action: "DELETED",
          deletedData: existingBuyer,
          timestamp: new Date().toISOString(),
        },
      },
    });

    const deletedBuyer = await Client.buyer.delete({
      where: {
        id,
        ownerId: senderId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Buyer deleted successfully",
      data: deletedBuyer,
    });
  } catch (e: any) {
    console.error("Error deleting buyer:", e);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting buyer",
      error: e.message,
    });
  }
}

export async function update_buyer_status(
  req: AuthenticatorRequest,
  res: Response
) {
  try {
    const id = req.body.id || req.params.id;
    const { status } = req.body;
    const senderId = req.user?.id;

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "Buyer ID and status are required",
      });
    }

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found",
      });
    }

    const validStatuses = [
      "New",
      "Qualified",
      "Contacted",
      "Visited",
      "Negotiation",
      "Converted",
      "Dropped",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const existingBuyer = await Client.buyer.findFirst({
      where: {
        id,
        ownerId: senderId,
      },
    });

    if (!existingBuyer) {
      return res.status(404).json({
        success: false,
        message:
          "Buyer not found or you don't have permission to update this buyer",
      });
    }

    await Client.buyerHistory.create({
      data: {
        buyerId: id,
        changedBy: senderId,
        changedAt: new Date(),
        diff: {
          action: "STATUS_UPDATED",
          statusChange: {
            from: existingBuyer.status,
            to: status,
          },
          timestamp: new Date().toISOString(),
        },
      },
    });

    const updatedBuyer = await Client.buyer.update({
      where: {
        id,
        ownerId: senderId,
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Buyer status updated successfully",
      data: updatedBuyer,
    });
  } catch (e: any) {
    console.error("Error updating buyer status:", e);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating buyer status",
      error: e.message,
    });
  }
}
const BuyerUpdateSchema = BuyerSchema.partial();
export async function update_buyer(req: AuthenticatorRequest, res: Response) {
  try {
    const senderId = req.user?.id;
    const buyerId = req.params.id; 

    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized: User ID not found" });
    }

    const result = BuyerUpdateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.format() });
    }

    const existingBuyer = await Client.buyer.findFirst({
      where: { id: buyerId as string, ownerId: senderId },
    });
    if (!existingBuyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    const data = result.data;

    const updateData: any = {};
    for (const key of Object.keys(data)) {
      const value = (data as any)[key];
      if (value !== undefined) updateData[key] = value ?? null;
    }

    const changes: Record<string, { from: any; to: any }> = {};
    for (const key of Object.keys(updateData)) {
      const oldVal = (existingBuyer as any)[key];
      const newVal = updateData[key];
      if (oldVal !== newVal) {
        changes[key] = { from: oldVal, to: newVal };
      }
    }

    const updatedBuyer = await Client.buyer.update({
      where: { id: buyerId as string },
      data: updateData,
    });

    if (Object.keys(changes).length > 0) {
      await Client.buyerHistory.create({
        data: {
          buyerId: buyerId as string,
          changedBy: senderId,
          diff: {
            action: "BUYER_UPDATED",
            changes,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return res.json({
      success: true,
      message: "Buyer updated successfully",
      buyer: updatedBuyer,
    });
  } catch (error: any) {
    console.error("Update buyer error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Duplicate field value violates unique constraint",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to update buyer",
    });
  }
}

export async function addBuyer(req: AuthenticatorRequest, res: Response) {
  try {
    const result = BuyerSchema.safeParse(req.body);
    const senderId = req.user?.id;

    if (!result.success) {
      return res.status(400).json({ error: result.error.format() });
    }

    if (!senderId) {
      return res.status(401).send({
        msg: "Unauthorized: User ID not found",
      });
    }

    const data = result.data;

    if (data.email) {
      const existingBuyer = await Client.buyer.findFirst({
        where: {
          ownerId: senderId,
          email: data.email,
        },
      });

      if (existingBuyer) {
        return res.status(409).json({
          error: "Buyer with this email already exists",
          message:
            "A buyer with this email address is already in your database",
        });
      }
    }

    const buyerData: any = {
      fullName: data.fullName,
      email: data.email ?? null,
      phone: data.phone,
      city: data.city,
      propertyType: data.propertyType,
      bhk: data.bhk ?? null,
      purpose: data.purpose,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      timeline: data.timeline,
      source: data.source,
      status: data.status,
      notes: data.notes ?? null,
      tags: data.tags,
      ownerId: senderId,
    };

    console.log("buyerData being saved:", buyerData);

    const buyer = await Client.buyer.create({
      data: buyerData,
    });

    res.send({
      msg: "Buyer data added successfully",
      success: true,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Buyer with this information already exists",
      });
    }

    return res.status(500).json({
      e: error,
      error: "Internal server error",
      message: "Failed to create buyer",
    });
  }
}
function buildFilterConditions(query: any) {
  const filters: any = {};

  if (query.city && query.city !== "all") {
    filters.city = query.city;
  }

  if (query.propertyType && query.propertyType !== "all") {
    filters.propertyType = query.propertyType;
  }

  if (query.bhk && query.bhk !== "all") {
    filters.bhk = query.bhk;
  }

  if (query.purpose && query.purpose !== "all") {
    filters.purpose = query.purpose;
  }

  if (query.timeline && query.timeline !== "all") {
    filters.timeline = query.timeline;
  }

  if (query.source && query.source !== "all") {
    filters.source = query.source;
  }

  if (query.status && query.status !== "all") {
    filters.status = query.status;
  }

  if (query.budgetMin) {
    filters.budgetMin = {
      gte: parseInt(query.budgetMin),
    };
  }

  if (query.budgetMax) {
    filters.budgetMax = {
      lte: parseInt(query.budgetMax),
    };
  }

  if (query.search) {
    filters.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search } },
      { notes: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.tags) {
    const tagArray = query.tags.split(",").map((tag: string) => tag.trim());
    filters.tags = {
      hasSome: tagArray,
    };
  }

  if (query.dateFrom) {
    const fromDate = new Date(query.dateFrom);
    if (!filters.createdAt) filters.createdAt = {};
    filters.createdAt.gte = fromDate;
  }

  if (query.dateTo) {
    const toDate = new Date(query.dateTo);
    toDate.setHours(23, 59, 59, 999); 
    if (!filters.createdAt) filters.createdAt = {};
    filters.createdAt.lte = toDate;
  }

  return filters;
}
const bhkcnv: Record<string, string> = {
  One: "1",
  Two: "2",
  Three: "3",
  Four: "4",
};
const timecnv: Record<string, string> = {
  ZeroToThree: "0-3m",
  ThreeToSix: "3-6m",
  MoreThanSix: "6m",
  Exploring: "Exploring",
};
export async function Buyers(req: AuthenticatorRequest, res: Response) {
  try {
    const senderId = req.user?.id;
    const id = req.query.id;

    if (!id) {
      if (!senderId) {
        return res.status(401).json({
          error: "Unauthorized: User ID not found",
        });
      }

      const filterConditions = buildFilterConditions(req.query);

      const whereClause = {
        ...filterConditions,
      };

      const buyers1 = await Client.buyer.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
      });

      if (buyers1.length === 0) {
        return res.status(200).json({
          error: "No buyers found",
          message: "No buyers match the specified criteria",
        });
      }

      const buyers = buyers1.map((buyer) => ({
        id: buyer.id,
        ownerId: buyer.ownerId,
        fullName: buyer.fullName,
        email: buyer.email || "",
        phone: buyer.phone,
        city: buyer.city,
        propertyType: buyer.propertyType,
        bhk: bhkcnv[buyer.bhk as string] || "",
        purpose: buyer.purpose,
        budgetMin: buyer.budgetMin || "",
        budgetMax: buyer.budgetMax || "",
        timeline: timecnv[buyer.timeline],
        source: buyer.source,
        status: buyer.status,
        notes: buyer.notes || "",
        tags: buyer.tags,
        createdAt: buyer.createdAt,
        updatedAt: buyer.updatedAt,
      }));

      
      res.send({
        buyers,
        success: true,
      });
    } else {
      try {
        const data = await Client.buyer.findUnique({
          where: {
            id: String(id),
          },
        });
        res.send({
          info: data,
          success: true,
        });
      } catch (error) {
        res.status(500).send({
          msg: "internal server error",
          success: false,
        });
      }
    }
  } catch (error) {
    console.error("Error exporting buyers CSV:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to export buyers",
    });
  }
}
export async function history(req: AuthenticatorRequest, res: Response) {
  try {
    const senderId = req.user?.id;
    const id = req.query.id;

    if (!senderId) {
      return res.status(401).json({
        error: "Unauthorized: User ID not found",
      });
    }

    
    const data = await Client.buyerHistory.findMany({
      where: {
        buyerId: String(id),
      },
    });
    res.send({
      history: data,
      success:true
    });
  } catch (error) {
    res.status(500).send({
      msg: "internal server error",
    });
  }
}

export async function getTotalClients(req: AuthenticatorRequest,res: Response) {
  try {
    const totalClients = await Client.buyer.count();

    const pendingDeals = await Client.buyer.count({
      where: {
        status: {
          notIn: ["Converted", "Dropped"],
        },
      },
    });

    return res.status(200).json({
      success: true,
      totalClients,
      pendingDeals,
    });
  } catch (error: any) {
    console.error("Error fetching client stats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching stats",
      error: error.message,
    });
  }
}
