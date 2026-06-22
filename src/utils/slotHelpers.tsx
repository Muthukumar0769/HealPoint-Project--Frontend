export const isBookableSlot = (slot: { status?: string }) => {
  const status = String(slot.status || "").toLowerCase();
  return !["unavailable", "booked", "blocked", "pending"].includes(status);
};