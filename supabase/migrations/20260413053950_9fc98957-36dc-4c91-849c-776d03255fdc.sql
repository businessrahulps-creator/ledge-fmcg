UPDATE invoices
SET seller_bank_account_name = c.bank_account_name
FROM companies c
WHERE invoices.company_id = c.id
  AND (invoices.seller_bank_account_name IS NULL OR invoices.seller_bank_account_name = '')
  AND c.bank_account_name IS NOT NULL
  AND c.bank_account_name != '';