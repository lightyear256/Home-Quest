import type { Response } from "express";
import { Client } from "../config/db.js";
import Papa from 'papaparse';
import z from 'zod';
import type { AuthenticatorRequest } from '../middleware/authMiddleware.js';

// CSV Import Schema with proper transformations
const CSVBuyerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10).max(15),
  city: z.enum(['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']),
  propertyType: z.enum(['Apartment', 'Villa', 'Plot', 'Office', 'Retail']),
  bhk: z.enum(['One', 'Two', 'Three', 'Four']).optional().or(z.literal('')),
  purpose: z.enum(['Buy', 'Rent']),
  budgetMin: z.string().optional().transform(val => val && val !== '' ? parseInt(val) : null),
  budgetMax: z.string().optional().transform(val => val && val !== '' ? parseInt(val) : null),
  timeline: z.enum(['ZeroToThree','ThreeToSix','MoreThanSix','Exploring']),
  source: z.enum(['Website', 'Referral', 'WalkIn', 'Call', 'Other']),
  status: z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']).default('New'),
  notes: z.string().max(1000).optional().or(z.literal('')),
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : []),
});

// Helper functions for enum conversions (for user-friendly CSV templates)
// function timelineToUserFriendly(timeline: string): string {
//   const mapping = {
//     'ZeroToThree': '0-3m',
//     'ThreeToSix': '3-6m', 
//     'MoreThanSix': '>6m',
//     'Exploring': 'Exploring'
//   };
//   return mapping[timeline as keyof typeof mapping] || timeline;
// }

// function sourceToUserFriendly(source: string): string {
//   const mapping = {
//     'WalkIn': 'Walk-in',
//     'Website': 'Website',
//     'Referral': 'Referral', 
//     'Call': 'Call',
//     'Other': 'Other'
//   };
//   return mapping[source as keyof typeof mapping] || source;
// }

// Build filter conditions based on query parameters
function buildFilterConditions(query: any) {
  const filters: any = {};

  if (query.city && query.city !== 'all') {
    filters.city = query.city;
  }

  if (query.propertyType && query.propertyType !== 'all') {
    filters.propertyType = query.propertyType;
  }

  if (query.bhk && query.bhk !== 'all') {
    filters.bhk = query.bhk;
  }

  if (query.purpose && query.purpose !== 'all') {
    filters.purpose = query.purpose;
  }

  if (query.timeline && query.timeline !== 'all') {
    filters.timeline = query.timeline;
  }

  if (query.source && query.source !== 'all') {
    filters.source = query.source;
  }

  if (query.status && query.status !== 'all') {
    filters.status = query.status;
  }

  if (query.budgetMin) {
    filters.budgetMin = {
      gte: parseInt(query.budgetMin)
    };
  }

  if (query.budgetMax) {
    filters.budgetMax = {
      lte: parseInt(query.budgetMax)
    };
  }

  if (query.search) {
    filters.OR = [
      { fullName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search } },
      { notes: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  if (query.tags) {
    const tagArray = query.tags.split(',').map((tag: string) => tag.trim());
    filters.tags = {
      hasSome: tagArray
    };
  }

  if (query.dateFrom) {
    const fromDate = new Date(query.dateFrom);
    if (!filters.createdAt) filters.createdAt = {};
    filters.createdAt.gte = fromDate;
  }

  if (query.dateTo) {
    const toDate = new Date(query.dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    if (!filters.createdAt) filters.createdAt = {};
    filters.createdAt.lte = toDate;
  }

  return filters;
}

// CSV Export - Download buyers as CSV with optional filters
export async function exportBuyersCSV(req: AuthenticatorRequest, res: Response) {
  try {
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({
        error: "Unauthorized: User ID not found",
      });
    }

    // Build filter conditions from query parameters
    const filterConditions = buildFilterConditions(req.query);
    
    // Add owner filter
    const whereClause = {
      ownerId: senderId,
      ...filterConditions
    };

    // Fetch buyers with applied filters
    const buyers = await Client.buyer.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (buyers.length === 0) {
      return res.status(404).json({
        error: "No buyers found",
        message: "No buyers match the specified criteria"
      });
    }

    // Transform data for CSV export
    const csvData = buyers.map(buyer => ({
      fullName: buyer.fullName,
      email: buyer.email || '',
      phone: buyer.phone,
      city: buyer.city,
      propertyType: buyer.propertyType,
      bhk: buyer.bhk || '',
      purpose: buyer.purpose,
      budgetMin: buyer.budgetMin || '',
      budgetMax: buyer.budgetMax || '',
      timeline: buyer.timeline,
      source: buyer.source,
      status: buyer.status,
      notes: buyer.notes || '',
      tags: buyer.tags.join(', '),
      createdAt: buyer.createdAt.toISOString(),
    }));

    // Generate CSV with proper quoting for export
    const csv = Papa.unparse(csvData, {
      quotes: true, // Always quote fields to handle commas in data
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
      header: true
    });

    // Set headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const hasFilters = Object.keys(filterConditions).length > 0;
    const filename = `buyers_export${hasFilters ? '_filtered' : ''}_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.status(200).send(csv);

  } catch (error) {
    console.error("Error exporting buyers CSV:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to export buyers"
    });
  }
}

// CSV Import - Upload and process CSV file
// CSV Import - Upload and process CSV file
export async function importBuyersCSV(req: AuthenticatorRequest, res: Response) {
  try {
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({
        error: "Unauthorized: User ID not found",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
        message: "Please upload a CSV file"
      });
    }

    // Validate file size (additional check)
    if (req.file.size === 0) {
      return res.status(400).json({
        error: "Empty file",
        message: "The uploaded file is empty"
      });
    }

    // Parse CSV content
    const csvContent = req.file.buffer.toString('utf-8');
    
    // Check if file has content
    if (!csvContent.trim()) {
      return res.status(400).json({
        error: "Empty file content",
        message: "The CSV file appears to be empty"
      });
    }

    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      const criticalErrors = parseResult.errors.filter(error => error.type === 'Quotes');
      if (criticalErrors.length > 0) {
        return res.status(400).json({
          error: "CSV parsing failed",
          message: "CSV format is invalid",
          details: parseResult.errors
        });
      }
    }

    const csvData = parseResult.data as any[];
    
    if (csvData.length === 0) {
      return res.status(400).json({
        error: "No data found",
        message: "The CSV file contains no data rows"
      });
    }

    // Validate headers
    const headers = Object.keys(csvData[0] || {});
    const headerValidation = validateCSVHeaders(headers);
    
    if (!headerValidation.valid) {
      return res.status(400).json({
        error: "Invalid CSV format",
        message: "Missing required columns",
        missingHeaders: headerValidation.missing
      });
    }

    const validBuyers = [];
    const errors = [];

    // Validate each row
    for (let i = 0; i < csvData.length; i++) {
      const rowData = csvData[i];
      const result = CSVBuyerSchema.safeParse(rowData);

      if (result.success) {
        // Convert data for Prisma
        const buyerData = {
          fullName: result.data.fullName,
          email: result.data.email || null,
          phone: result.data.phone,
          city: result.data.city,
          propertyType: result.data.propertyType,
          bhk: result.data.bhk || null,
          purpose: result.data.purpose,
          budgetMin: result.data.budgetMin,
          budgetMax: result.data.budgetMax,
          timeline: result.data.timeline,
          source: result.data.source,
          status: result.data.status,
          notes: result.data.notes || null,
          tags: result.data.tags,
          ownerId: senderId
        };

        validBuyers.push(buyerData);
      } else {
        errors.push({
          row: i + 2, // +2 because CSV has header row and arrays are 0-indexed
          data: rowData,
          errors: result.error.format()
        });
      }
    }

    if (errors.length > 0 && validBuyers.length === 0) {
      return res.status(400).json({
        error: "All rows have validation errors",
        message: "No valid data found to import",
        details: errors.slice(0, 10) // Limit error details to first 10
      });
    }

    // Check for duplicates by email before insertion
    const emailsToCheck = validBuyers
      .filter(buyer => buyer.email) // Only check buyers with email
      .map(buyer => buyer.email as string);

    let existingEmails:any = [];
    if (emailsToCheck.length > 0) {
      const existingBuyers = await Client.buyer.findMany({
        where: {
          ownerId: senderId,
          email: {
            in: emailsToCheck
          }
        },
        select: {
          email: true
        }
      });
      existingEmails = existingBuyers.map(buyer => buyer.email);
    }

    // Filter out buyers with duplicate emails
    const buyersToInsert = validBuyers.filter(buyer => 
      !buyer.email || !existingEmails.includes(buyer.email)
    );

    const duplicateCount = validBuyers.length - buyersToInsert.length;

    // Insert valid buyers
    let createdBuyers;
    try {
      if (buyersToInsert.length > 0) {
        createdBuyers = await Client.buyer.createMany({
          data: buyersToInsert,
          skipDuplicates: true
        });
      } else {
        createdBuyers = { count: 0 };
      }
    } catch (dbError: any) {
      console.error("Database error during import:", dbError);
      return res.status(500).json({
        error: "Database error",
        message: "Failed to save data to database"
      });
    }

    return res.status(201).json({
      success: true,
      message: "CSV import completed successfully",
      summary: {
        totalRows: csvData.length,
        successful: createdBuyers.count,
        failed: errors.length,
        duplicatesSkipped: duplicateCount,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined // Show first 5 errors
      }
    });

  } catch (error: any) {
    console.error("Error importing buyers CSV:", error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: "Duplicate entries found",
        message: "Some buyers already exist in the database"
      });
    }
    
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to import buyers",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Get CSV template - Download empty CSV with proper headers
export async function getCSVTemplate(req: AuthenticatorRequest, res: Response) {
  try {
    const templateData = [{
      fullName: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      city: "Chandigarh",
      propertyType: "Apartment",
      bhk: "Three",
      purpose: "Buy",
      budgetMin: "5000000",
      budgetMax: "7000000",
      timeline: "ZeroToThree",
      source: "Website",
      status: "New",
      notes: "Looking for 3BHK apartment in Chandigarh",
      tags: "urgent, premium"
    }];

    const csv = Papa.unparse(templateData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="buyers_import_template.csv"');
    
    return res.status(200).send(csv);

  } catch (error) {
    console.error("Error generating CSV template:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to generate template"
    });
  }
}

// Utility function to validate CSV structure before processing
export function validateCSVHeaders(headers: string[]): { valid: boolean; missing: string[] } {
  const requiredHeaders = [
    'fullName', 'phone', 'city', 'propertyType', 
    'purpose', 'timeline', 'source'
  ];
  
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const missing = requiredHeaders.filter(required => 
    !normalizedHeaders.includes(required.toLowerCase())
  );
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Get import/export statistics
export async function getImportExportStats(req: AuthenticatorRequest, res: Response) {
  try {
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({
        error: "Unauthorized: User ID not found",
      });
    }

    const totalBuyers = await Client.buyer.count({
      where: { ownerId: senderId }
    });

    const recentImports = await Client.buyer.count({
      where: {
        ownerId: senderId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    const statusDistribution = await Client.buyer.groupBy({
      by: ['status'],
      where: { ownerId: senderId },
      _count: {
        status: true
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalBuyers,
        recentImports,
        statusDistribution: statusDistribution.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error("Error fetching import/export stats:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch statistics"
    });
  }
}