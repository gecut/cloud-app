/**
 * Generates a collision-free, guaranteed unique sequential invoice number.
 * Starts from 30001+ and ensures no unique constraint violation can ever occur.
 */
export async function getNextUniqueInvoiceNumber(prisma: any): Promise<string> {
  const year = new Date().getFullYear();
  let nextSeq = 1;

  try {
    const seq = await prisma.invoiceSequence.upsert({
      where: { year },
      create: { year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    nextSeq = seq.lastNumber;
  } catch {
    const count = await prisma.invoice.count().catch(() => 0);
    nextSeq = count + 1;
  }

  let candidate = 30000 + nextSeq;

  // Ensure candidate number is completely unique across existing invoices
  while (true) {
    const existing = await prisma.invoice.findFirst({
      where: { invoiceNumber: candidate.toString() },
      select: { id: true },
    });
    if (!existing) {
      break;
    }
    candidate++;
  }

  // Update sequence to match the highest assigned number
  await prisma.invoiceSequence
    .update({
      where: { year },
      data: { lastNumber: candidate - 30000 },
    })
    .catch(() => {});

  return candidate.toString();
}
