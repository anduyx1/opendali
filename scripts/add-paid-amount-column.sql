-- Add paid_amount column to goods_receipts table
ALTER TABLE goods_receipts 
ADD COLUMN paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER total_amount;

-- Update existing records to set paid_amount based on status
UPDATE goods_receipts 
SET paid_amount = CASE 
  WHEN status = 'completed' THEN total_amount 
  ELSE 0 
END;
