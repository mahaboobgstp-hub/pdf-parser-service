/**
 * parser.js
 * Core PDF parsing logic for bank statements
 */

const pdf = require("pdf-parse");

/**
 * Extract transactions from PDF text
 */
function parseTransactions(text) {
  const lines = text.split("\n");
  const transactions = [];

  for (let line of lines) {
    // Normalize spacing
    line = line.replace(/\s+/g, " ").trim();

    // Match Indian date format at line start: DD/MM/YYYY
    if (!/^\d{2}\/\d{2}\/\d{4}/.test(line)) continue;

    const parts = line.split(" ");

    // Parse date
    const dateParts = parts[0].split("/");
    const txnDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    // Extract numeric values (amounts & balance)
    const numbers = parts
      .map(p => p.replace(/,/g, ""))
      .filter(p => /^\d+(\.\d+)?$/.test(p))
      .map(Number);

    // We need at least debit/credit + balance
    if (numbers.length < 2) continue;

    const balance = numbers[numbers.length - 1];
    const credit = numbers[numbers.length - 2] || 0;
    const debit = numbers[numbers.length - 3] || 0;

    // Extract description (everything after date)
    const description = line.substring(10).trim().toUpperCase();

    transactions.push({
      txn_date: txnDate,
      description,
      debit,
      credit,
      balance
    });
  }

  return transactions;
}

/**
 * Calculate simple derived metrics
 */
function deriveMetrics(transactions) {
  let totalCredits = 0;
  let totalDebits = 0;

  for (const t of transactions) {
    totalCredits += t.credit || 0;
    totalDebits += t.debit || 0;
  }

  return {
    total_credits: Number(totalCredits.toFixed(2)),
    total_debits: Number(totalDebits.toFixed(2)),
    transaction_count: transactions.length
  };
}

/**
 * MAIN FUNCTION
 * Parses PDF buffer and returns normalized JSON
 */
async function parsePDFBuffer(buffer) {
  const data = await pdf(buffer);

  if (!data.text || data.text.length < 100) {
    throw new Error("PDF text not readable or scanned");
  }

  const transactions = parseTransactions(data.text);

  return {
    source: "PDF",
    parser: "MICROSERVICE",
    transactions,
    derived_metrics: deriveMetrics(transactions)
  };
}

module.exports = {
  parsePDFBuffer
};
