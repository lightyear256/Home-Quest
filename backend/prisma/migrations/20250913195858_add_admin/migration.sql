-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- AddForeignKey
ALTER TABLE "public"."Buyer" ADD CONSTRAINT "Buyer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
