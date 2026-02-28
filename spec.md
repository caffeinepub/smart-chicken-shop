# Specification

## Summary
**Goal:** Ensure PDF receipt export includes all required fields and is accessible to all roles, and add a PDF export button to the Admin Dashboard reports section.

**Planned changes:**
- Update `frontend/src/utils/pdfExport.ts` to include all required receipt fields: barcode-style invoice number (rendered visually), customer name and ID, weight (kg), rate per kg, total price, payment amount, payment type, remaining balance or CLEAR status, date and time, and shop name
- Ensure the receipt download/print button is visible and functional for both Admin and Staff roles in `TransactionList` and `ReceiptView` components
- Add an "Export PDF" button to the Admin Dashboard reports section that generates and downloads a formatted PDF of the currently filtered (daily/weekly/monthly) transaction summary metrics and customer balance list (CLEAR/PENDING status)
- PDF export on the dashboard is visible to Admin role only; all PDF generation is frontend-only with no backend changes

**User-visible outcome:** Admin and Staff can download fully detailed receipts from transaction views; Admin can also export a PDF of the current filtered report summary directly from the dashboard.
