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
  
  // Get date in format: ۱۴۰۳/۰۱/۱۵
  const dateStr = now.toLocaleDateString("fa-IR");
  
  // Convert Persian numbers to English numbers and remove slashes
  const convertToEnglishNumber = (str) => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.replace(/[۰-۹]/g, d => persianNumbers.indexOf(d).toString());
  };
  
  // Convert to English numbers and remove slashes
  return convertToEnglishNumber(dateStr).replace(/\//g, '');
}

// For displaying the date in English format
function getDisplayDate() {
  return new Date().toLocaleDateString("fa-IR-u-nu-latn");
}

function getFirstInvoiceNumber() {
  const today = getHijriShamsiDate();
  return today + "001";
}

function generateInvoiceNumber() {
  // Get the current invoice number from display
  const currentNumber = document.getElementById("invoiceNumber").innerText.split(": ")[1];
  
  // Extract the base (first 7 digits) and counter (last 4 digits)
  const base = currentNumber.slice(0, -4);
  const counter = parseInt(currentNumber.slice(-4));
  
  // Increment counter and pad to 4 digits
  const newCounter = (counter + 1).toString().padStart(4, '0');
  
  // Return new invoice number
  return base + newCounter;
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
    return getFirstInvoiceNumber();
  }
  return history[history.length - 1].number;
}

// Function to collect form data
function collectFormData() {
  const date = document.getElementById("date").innerText;
  const falafelQty = parseInt(document.getElementById("falafelQty").value) || 0;
  const burgerQty = parseInt(document.getElementById("burgerQty").value) || 0;
  const drinkQty = parseInt(document.getElementById("drinkQty").value) || 0;
  const adjustment = parseInt(document.getElementById("adjustmentAmount").value) || 0;
  
  // Calculate total without commas
  const total = (falafelQty * 45000) + (burgerQty * 80000) + (drinkQty * 25000) + adjustment;

  return {
    invoiceNumber: document.getElementById("invoiceNumber").innerText.split(": ")[1],
    date,
    items: {
      falafel: {
        quantity: falafelQty,
        price: 45000,
        total: falafelQty * 45000
      },
      burger: {
        quantity: burgerQty,
        price: 80000,
        total: burgerQty * 80000
      },
      drink: {
        quantity: drinkQty,
        price: 25000,
        total: drinkQty * 25000
      }
    },
    adjustment: adjustment,
    totalAmount: total,
    paymentMethod: document.getElementById("payment").value
  };
}

// Function to send data to Google Sheets
async function sendToGoogleSheets(data) {
  const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyzzy1Fv5LZWPjwpAK3pqz3bwRoHTscJriTOUDBL8oUtHTvyE01LFLwWEJ8dXQ5aIIqKQ/exec';
  
  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    // Since we're using no-cors, we won't get a meaningful response
    // We'll assume success if we get here
    return true;
  } catch (error) {
    console.error('Error sending data to Google Sheets:', error);
    return false;
  }
}

// Function to clear all form fields
function clearForm() {
  // Clear quantities
  document.querySelectorAll(".quantity").forEach(input => input.value = "");
  
  // Clear adjustment
  document.getElementById("adjustmentAmount").value = "";
  
  // Reset total amount
  document.getElementById("totalAmount").innerText = "0";
  
  // Reset payment method to default (first option)
  document.getElementById("payment").selectedIndex = 0;
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Set current date
  document.getElementById("date").innerText = getDisplayDate();

  // Display first invoice number
  const invoiceNumber = getFirstInvoiceNumber();
  document.getElementById("invoiceNumber").innerText = `شماره فاکتور: ${invoiceNumber}`;

  // Add event listeners to quantity inputs
  document.querySelectorAll(".quantity").forEach(input => {
    input.addEventListener("input", calculateTotal);
  });

  // Add event listener to adjustment input
  document.getElementById("adjustmentAmount").addEventListener("input", calculateTotal);

  function calculateTotal() {
    let total = 0;
    // Calculate products total
    document.querySelectorAll(".quantity").forEach(qty => {
      let price = parseInt(qty.getAttribute("data-price"));
      let count = parseInt(qty.value) || 0;
      total += price * count;
    });

    // Add or subtract adjustment amount
    const adjustmentInput = document.getElementById("adjustmentAmount");
    const adjustment = parseInt(adjustmentInput.value) || 0;
    total += adjustment;

    // Display formatted total
    document.getElementById("totalAmount").innerText = total.toLocaleString("fa-IR-u-nu-latn");
  }

  // Add click event listener to submit button
  document.getElementById("submitBtn").addEventListener("click", async function() {
    // Check if any quantity is entered
    const hasQuantity = Array.from(document.querySelectorAll(".quantity"))
      .some(input => parseInt(input.value) > 0);

    if (!hasQuantity) {
      alert('لطفا تعداد محصولات را وارد کنید');
      return;
    }

    // Collect form data with current invoice number
    const formData = collectFormData();
    const success = await sendToGoogleSheets(formData);
    
    if (success) {
      alert('فاکتور با موفقیت ثبت شد');
      clearForm();
      // After successful submission, generate and display next invoice number
      const nextInvoiceNumber = generateInvoiceNumber();
      document.getElementById("invoiceNumber").innerText = `شماره فاکتور: ${nextInvoiceNumber}`;
    } else {
      alert('خطا در ثبت فاکتور');
    }
  });
}); 