export async function sendPrescription(prescription: Record<string, unknown>) { return { id: `rx_${Date.now()}`, status: 'sent', prescription }; }
export async function trackPrescriptionStatus(id: string) { return { id, status: 'fulfilled' }; }
export async function cancelPrescription(id: string) { return { id, status: 'cancelled' }; }
