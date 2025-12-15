const fs = require("fs");
const pdf = require("pdf-parse");

/**
 * Extract text from PDF using pdf-parse
 */
async function extractText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);

  if (!data.text || data.text.length < 100) {
    throw new Error("PDF text not readable or scanned");
  }

  return data.text;
}

/**
 * Parse transaction rows from extracted text
 */
function parseTransactions(text) {
  const lines = text.split("\n");
  const transactions = [];

  for (let line of lines) {
    line = line.replace(/\s+/g, " ").trim();

    // Match Indian bank date format: DD/MM/YYYY
    if (!/^\d{2}\/\d{2}\/\d{4}/.test(line)) continue;

    const parts = line.split(" ");
    const txnDate = parts[0].split("/").reverse().join("-");

    // Extract numeric values (amounts)
    const numbers = parts
      .filter(p => p.replace(/,/g, "").match(/^\d+(\.\d+)?$/))
      .map(p => Number(p.replace(/,/g, "")));

    if (numbers.length < 2) continue;

    transactions.push({
      txn_date: txnDate,
      description: line.substring(11).toUpperCase(),
      debit: numbers[numbers.length - 3] || 0,
      credit: numbers[numbers.length - 2] || 0,
      balance: numbers[numbers.length - 1]
    });
  }

  return transactions;
}

/**
 * Basic metrics for underwriting
 */
function deriveMetrics(transactions) {
  return {
    total_credits: transactions.reduce((s, t) => s + t.credit, 0),
    total_debits: transactions.reduce((s, t) => s + t.debit, 0),
    transaction_count: transactions.length
  };
}

/**
 * Main exported function
 */
module.exports = async function parsePDF(filePath) {
  const text = await extractText(filePath);
  const transactions = parseTransactions(text);

  return {
    source: "PDF",
    parser: "MICROSERVICE",
    transactions,
    derived_metrics: deriveMetrics(transactions)
  };
};
