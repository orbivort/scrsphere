/**
 * One-off backfill: group legacy per-user `DailyUpdate` records into the new
 * team-level `DailyScrum` model (one record per sprint + date).
 *
 * Best-effort mapping:
 *   - progressNotes   <- concatenated "yesterdayWork" values (what was done)
 *   - adaptationsNotes <- concatenated "todayWork" values (planned adjustments)
 *   - planForNextDay  <- concatenated "todayWork" values (next-day plan)
 *   - participants    <- the set of userIds that submitted a legacy update
 *
 * Run from packages/backend:
 *   pnpm tsx scripts/backfill-daily-scrums.ts
 */
import prisma from '../src/utils/prisma';
import { generateUUIDv7 } from '../src/utils/uuid';

async function main(): Promise<void> {
  const legacyUpdates = await prisma.dailyUpdate.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (legacyUpdates.length === 0) {
    console.log('No legacy daily updates to backfill.');
    return;
  }

  // Group legacy per-user updates by (sprintId, updateDate).
  const groups = new Map<string, typeof legacyUpdates>();
  for (const update of legacyUpdates) {
    const key = `${update.sprintId}|${update.updateDate.toISOString()}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(update);
    groups.set(key, bucket);
  }

  let created = 0;
  let skipped = 0;

  for (const [, updates] of groups) {
    const first = updates[0];
    if (!first) {
      skipped += 1;
      continue;
    }

    const progressParts: string[] = [];
    const adaptParts: string[] = [];
    const participantIds: string[] = [];

    for (const update of updates) {
      if (update.yesterdayWork) {
        progressParts.push(update.yesterdayWork);
      }
      if (update.todayWork) {
        adaptParts.push(update.todayWork);
      }
      if (!participantIds.includes(update.userId)) {
        participantIds.push(update.userId);
      }
    }

    const existing = await prisma.dailyScrum.findUnique({
      where: {
        sprintId_scrumDate: {
          sprintId: first.sprintId,
          scrumDate: first.updateDate,
        },
      },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.dailyScrum.create({
      data: {
        id: generateUUIDv7(),
        sprintId: first.sprintId,
        scrumDate: first.updateDate,
        progressNotes: progressParts.length > 0 ? progressParts.join('\n') : null,
        adaptationsNotes: adaptParts.length > 0 ? adaptParts.join('\n') : null,
        planForNextDay: adaptParts.length > 0 ? adaptParts.join('\n') : null,
        createdBy: first.createdBy,
        participants: {
          create: participantIds.map((userId) => ({
            id: generateUUIDv7(),
            userId,
            createdBy: first.createdBy,
          })),
        },
      },
    });

    created += 1;
  }

  console.log(`Backfill complete: ${created} daily scrums created, ${skipped} skipped.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('Backfill failed:', error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
