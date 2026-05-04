import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load test environment variables
config({ path: resolve(process.cwd(), '.env.test') });
process.env.NODE_ENV = 'test';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hash } from 'bcrypt';
import { faker } from '@faker-js/faker';
import { generateUUIDv7 } from '../src/utils/uuid';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log(`Using database: ${process.env.DATABASE_URL}`);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

interface DataGenerationOptions {
  teams: number;
  usersPerTeam: number;
  sprintsPerTeam: number;
  pbisPerSprint: number;
  tasksPerPbi: number;
}

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'LoadTest123!';

async function clearExistingTestData() {
  console.log('Clearing existing test data...');

  await prisma.task.deleteMany({
    where: {
      title: { contains: 'LoadTest' },
    },
  });

  await prisma.productBacklogItem.deleteMany({
    where: {
      title: { contains: 'LoadTest' },
    },
  });

  await prisma.sprint.deleteMany({
    where: {
      name: { contains: 'LoadTest' },
    },
  });

  await prisma.teamMember.deleteMany({
    where: {
      team: {
        name: { contains: 'LoadTest' },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: { contains: '@loadtest.local' },
    },
  });

  await prisma.team.deleteMany({
    where: {
      name: { contains: 'LoadTest' },
    },
  });

  console.log('Existing test data cleared.');
}

async function generateTestData(options: DataGenerationOptions) {
  console.log('Starting test data generation...');
  console.log(`Configuration: ${options.teams} teams, ${options.usersPerTeam} users per team`);
  console.log(
    `Sprints per team: ${options.sprintsPerTeam}, PBIs per sprint: ${options.pbisPerSprint}, Tasks per PBI: ${options.tasksPerPbi}`
  );

  const hashedPassword = await hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  for (let t = 0; t < options.teams; t++) {
    const teamId = generateUUIDv7();
    const team = await prisma.team.create({
      data: {
        id: teamId,
        name: `LoadTest Team ${t + 1}`,
        description: `Test team ${t + 1} for load testing purposes`,
      },
    });

    const users: { id: string; role: string }[] = [];

    for (let u = 0; u < options.usersPerTeam; u++) {
      const userId = generateUUIDv7();
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: `team${t + 1}_user${u + 1}@loadtest.local`,
          password: hashedPassword,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
        },
      });

      const role = u === 0 ? 'PRODUCT_OWNER' : u === 1 ? 'SCRUM_MASTER' : 'DEVELOPER';
      const teamMemberId = generateUUIDv7();

      await prisma.teamMember.create({
        data: {
          id: teamMemberId,
          teamId: team.id,
          userId: user.id,
          role,
        },
      });

      users.push({ id: user.id, role });
    }

    console.log(`Created team ${t + 1}/${options.teams} with ${users.length} users`);

    for (let s = 0; s < options.sprintsPerTeam; s++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - s * 14);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14);

      const sprintId = generateUUIDv7();
      const sprint = await prisma.sprint.create({
        data: {
          id: sprintId,
          teamId: team.id,
          name: `LoadTest Sprint ${t + 1}-${s + 1}`,
          startDate,
          endDate,
          status: s === 0 ? 'ACTIVE' : 'COMPLETED',
          sprintGoal: `LoadTest sprint goal for sprint ${s + 1}`,
        },
      });

      for (let p = 0; p < options.pbisPerSprint; p++) {
        const pbiId = generateUUIDv7();
        const pbi = await prisma.productBacklogItem.create({
          data: {
            id: pbiId,
            teamId: team.id,
            title: `LoadTest PBI ${t + 1}-${s + 1}-${p + 1}`,
            description: faker.lorem.paragraph(),
            priority: (['MUST_HAVE', 'SHOULD_HAVE', 'COULD_HAVE'] as const)[p % 3],
            status: (['NEW', 'REFINED', 'READY', 'IN_PROGRESS', 'DONE'] as const)[p % 5],
            storyPoints: [1, 2, 3, 5, 8, 13][p % 6],
          },
        });

        for (let tk = 0; tk < options.tasksPerPbi; tk++) {
          const assignee = users[tk % users.length];
          const taskId = generateUUIDv7();

          await prisma.task.create({
            data: {
              id: taskId,
              sprintId: sprint.id,
              pbiId: pbi.id,
              title: `LoadTest Task ${t + 1}-${s + 1}-${p + 1}-${tk + 1}`,
              description: faker.lorem.sentence(),
              status: (['TODO', 'IN_PROGRESS', 'DONE'] as const)[tk % 3],
              assigneeId: assignee.id,
              estimatedHours: [2, 4, 8][tk % 3],
            },
          });
        }
      }

      console.log(
        `  Created sprint ${s + 1}/${options.sprintsPerTeam} with ${options.pbisPerSprint} PBIs`
      );
    }
  }

  console.log('\nTest data generation complete!');
  console.log('Summary:');
  console.log(`  - Teams: ${options.teams}`);
  console.log(`  - Users: ${options.teams * options.usersPerTeam}`);
  console.log(`  - Sprints: ${options.teams * options.sprintsPerTeam}`);
  console.log(
    `  - Product Backlog Items: ${options.teams * options.sprintsPerTeam * options.pbisPerSprint}`
  );
  console.log(
    `  - Tasks: ${options.teams * options.sprintsPerTeam * options.pbisPerSprint * options.tasksPerPbi}`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const options: DataGenerationOptions = {
    teams: 10,
    usersPerTeam: 15,
    sprintsPerTeam: 5,
    pbisPerSprint: 10,
    tasksPerPbi: 3,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--teams':
        options.teams = parseInt(args[++i], 10);
        break;
      case '--users':
        options.usersPerTeam = parseInt(args[++i], 10);
        break;
      case '--sprints':
        options.sprintsPerTeam = parseInt(args[++i], 10);
        break;
      case '--pbis':
        options.pbisPerSprint = parseInt(args[++i], 10);
        break;
      case '--tasks':
        options.tasksPerPbi = parseInt(args[++i], 10);
        break;
      case '--clear':
        await clearExistingTestData();
        return;
      case '--help':
        console.log(`
Usage: ts-node generate-load-test-data.ts [options]

Options:
  --teams <number>     Number of teams to create (default: 10)
  --users <number>     Users per team (default: 15)
  --sprints <number>   Sprints per team (default: 5)
  --pbis <number>      PBIs per sprint (default: 10)
  --tasks <number>     Tasks per PBI (default: 3)
  --clear              Clear existing test data only
  --help               Show this help message

Examples:
  ts-node generate-load-test-data.ts --teams 5 --users 10
  ts-node generate-load-test-data.ts --clear
        `);
        return;
    }
  }

  await clearExistingTestData();
  await generateTestData(options);
}

main()
  .catch((error) => {
    console.error('Error generating test data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
