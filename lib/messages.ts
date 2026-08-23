// Reminder message templates. UI stays English; parent-facing messages
// are Hinglish by default with an English option (per tutor setting).

type MsgInput = {
  parentName: string;
  studentName: string;
  monthLabel: string; // "August 2026"
  amount: number;
  tutorName: string;
  businessName: string;
  payUrl: string; // razorpay link or upi:// deep link
};

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function reminderMessage(lang: string, i: MsgInput): string {
  const from = i.businessName || i.tutorName;
  if (lang === "english") {
    return (
      `Dear ${i.parentName || "Parent"},\n\n` +
      `This is a gentle reminder that the tuition fee for ${i.studentName} ` +
      `for ${i.monthLabel} is ₹${i.amount}.\n\n` +
      `You can pay here: ${i.payUrl}\n\n` +
      `Thank you!\n— ${from}\n\n_Sent via FeeSaathi_`
    );
  }
  // hinglish (default)
  return (
    `Namaste ${i.parentName || "ji"} 🙏\n\n` +
    `${i.studentName} ki ${i.monthLabel} ki tuition fees ₹${i.amount} due hai.\n\n` +
    `Yahan se pay kar sakte hain: ${i.payUrl}\n\n` +
    `Dhanyavaad!\n— ${from}\n\n_Sent via FeeSaathi_`
  );
}

export function receiptMessage(lang: string, i: MsgInput): string {
  const from = i.businessName || i.tutorName;
  if (lang === "english") {
    return (
      `Dear ${i.parentName || "Parent"},\n\n` +
      `We have received ₹${i.amount} towards ${i.studentName}'s tuition fee ` +
      `for ${i.monthLabel}. Thank you!\n\n— ${from}\n\n_Sent via FeeSaathi_`
    );
  }
  return (
    `Namaste ${i.parentName || "ji"} 🙏\n\n` +
    `${i.studentName} ki ${i.monthLabel} ki fees ₹${i.amount} mil gayi hai. ` +
    `Dhanyavaad!\n\n— ${from}\n\n_Sent via FeeSaathi_`
  );
}

// wa.me share link — works with the tutor's own WhatsApp, zero setup.
export function waShareLink(phone: string, text: string) {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}
