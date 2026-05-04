export async function verifyTicket(_ticketNumber: string) {
  // Integrar com GLPI usando tokens em .env.
  return { ok: true, message: "Ticket valid" };
}

export async function postWithdrawalComment(_ticketNumber: string, _message: string) {
  // Integrar com GLPI usando tokens em .env.
  return { ok: true };
}
