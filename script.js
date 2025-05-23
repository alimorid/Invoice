function getEffectiveDate() {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000; // 7 ساعت به میلی‌ثانیه
  const shifted = new Date(now.getTime() - offset);
  return shifted.toLocaleDateString("fa-IR-u-nu-latn"); // مثل: 1403/03/02
}

function getInvoiceNumber() {
  const today = getEffectiveDate();
  const current = JSON.parse(localStorage.getItem("todayInvoice") || "{}");

  if (current.date !== today) {
    // شروع از 1 در روز جدید (بر اساس ساعت 7 صبح)
    localStorage.setItem("todayInvoice", JSON.stringify({ date: today, count: 1 }));
    return 1;
  } else {
    current.count += 1;
    localStorage.setItem("todayInvoice", JSON.stringify(current));
    return current.count;
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Set current date
  document.getElementById("date").innerText = new Date().toLocaleDateString("fa-IR");

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
    const number = getInvoiceNumber();
    document.getElementById("invoiceNumber").innerText = `شماره فاکتور: ${number}`;
  });
}); 