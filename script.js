function getHijriShamsiDate() {
  const now = new Date();
  // Adjust date to consider 7am as start of new day
  // If it's before 7am, we're still in "yesterday's" business day
  const businessDayOffset = 7; // 7am cutoff
  const currentHour = now.getHours();
  const isBeforeCutoff = currentHour < businessDayOffset;
  
  // If it's before 7am, subtract one day to get "yesterday's" business date
  if (isBeforeCutoff) {
    now.setDate(now.getDate() - 1);
  }
  
  // Get date in format: 1403/01/15
  const dateStr = now.toLocaleDateString("fa-IR-u-nu-latn");
  
  // Remove slashes and convert to YYYYMMDD format
  return dateStr.replace(/\//g, '');
}

function generateInvoiceNumber() {
  const today = getHijriShamsiDate(); // Format: YYYYMMDD
  const storedData = localStorage.getItem("invoiceCounter");
  let dailyCounter;

  if (!storedData) {
    // First invoice ever
    dailyCounter = {
      date: today,
      count: 1
    };
  } else {
    const data = JSON.parse(storedData);
    if (data.date !== today) {
      // New day, reset counter
      dailyCounter = {
        date: today,
        count: 1
      };
    } else {
      // Same day, increment counter
      dailyCounter = {
        date: today,
        count: data.count + 1
      };
    }
  }

  // Save the updated counter
  localStorage.setItem("invoiceCounter", JSON.stringify(dailyCounter));

  // Format counter to 3 digits (001, 002, etc.)
  const counterStr = dailyCounter.count.toString().padStart(3, '0');
  
  // Create the full invoice number
  const invoiceNumber = today + counterStr;

  // Save this invoice to history
  saveInvoiceToHistory(invoiceNumber);
  
  return invoiceNumber;
}

function saveInvoiceToHistory(invoiceNumber) {
  // Get existing history or initialize empty array
  const history = JSON.parse(localStorage.getItem("invoiceHistory") || "[]");
  
  // Add new invoice with timestamp
  history.push({
    number: invoiceNumber,
    timestamp: new Date().toISOString(),
    // You can add more details here like total amount, items, etc.
  });
  
  // Save back to localStorage
  localStorage.setItem("invoiceHistory", JSON.stringify(history));
}

// Function to get all invoices for a specific date
function getInvoicesForDate(date) {
  const history = JSON.parse(localStorage.getItem("invoiceHistory") || "[]");
  return history.filter(invoice => invoice.number.startsWith(date));
}

// Function to get the last generated invoice number
function getLastInvoiceNumber() {
  const history = JSON.parse(localStorage.getItem("invoiceHistory") || "[]");
  if (history.length === 0) {
    return null;
  }
  return history[history.length - 1].number;
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Set current date
  document.getElementById("date").innerText = new Date().toLocaleDateString("fa-IR");

  // Display last invoice number if it exists
  const lastInvoice = getLastInvoiceNumber();
  if (lastInvoice) {
    document.getElementById("invoiceNumber").innerText = `شماره فاکتور: ${lastInvoice}`;
  }

  // Add event listeners to quantity inputs
  document.querySelectorAll(".quantity").forEach(input => {
    input.addEventListener("input", () => {
      let total = 0;
      document.querySelectorAll(".quantity").forEach(qty => {
        let price = parseInt(qty.getAttribute("data-price"));
        let count = parseInt(qty.value) || 0;
        total += price * count;
      });
      document.getElementById("totalAmount").innerText = total.toLocaleString("fa-IR");
    });
  });

  // Add click event listener to submit button
  document.getElementById("submitBtn").addEventListener("click", function() {
    const invoiceNumber = generateInvoiceNumber();
    document.getElementById("invoiceNumber").innerText = `شماره فاکتور: ${invoiceNumber}`;
  });
}); 