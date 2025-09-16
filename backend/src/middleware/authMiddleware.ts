import type{ Response,Request,NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url'; 
import path,{ dirname } from 'path';  

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../.env'), 
});

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

export interface AuthenticatorRequest extends Omit<Request, 'file' | 'files'> {
    user?: {
        id: string;
        email: string;
    };
    file?: MulterFile;
    files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
}

export const authMiddleware= async(req:AuthenticatorRequest,res:Response,next:NextFunction)=>{
    const token =req.header("Authorization")?.replace("Bearer ","");
    if(!token){
        res.status(403).send({
            msg:"token not found"
        })
        return
    }
    try {
        const decoded=jwt.verify(token,process.env.JWT_SECRET as string) as{
            id:string;
            email:string;
           
        }
        req.user=decoded;
        next();
    } catch (error) {
        res.status(403).send({
            msg:"Token Invalid",
            error:error
        })
    }
}