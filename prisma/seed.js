const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Создаем тестового пользователя
  const user = await prisma.pdUser.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Евгения Попова',
      email: 'evgeniya.popova@example.com',
      raw: { id: 1, name: 'Евгения Попова', email: 'evgeniya.popova@example.com' }
    },
  })

  // Создаем тестовые пайплайны
  const salesCisPipeline = await prisma.pdPipeline.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Sales CIS',
      raw: { id: 1, name: 'Sales CIS' }
    },
  })

  const clientsCisPipeline = await prisma.pdPipeline.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Clients CIS',
      raw: { id: 2, name: 'Clients CIS' }
    },
  })

  // Создаем тестовые этапы
  const recognizeStage = await prisma.pdStage.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      pipelineId: 1,
      name: 'E – Recognize',
      orderNo: 1,
      raw: { id: 1, pipeline_id: 1, name: 'E – Recognize', order_no: 1 }
    },
  })

  const purchaseStage = await prisma.pdStage.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      pipelineId: 1,
      name: 'A – Purchase',
      orderNo: 5,
      raw: { id: 2, pipeline_id: 1, name: 'A – Purchase', order_no: 5 }
    },
  })

  const integrationStage = await prisma.pdStage.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      pipelineId: 2,
      name: 'Integration',
      orderNo: 1,
      raw: { id: 3, pipeline_id: 2, name: 'Integration', order_no: 1 }
    },
  })

  const pilotStage = await prisma.pdStage.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      pipelineId: 2,
      name: 'Pilot',
      orderNo: 2,
      raw: { id: 4, pipeline_id: 2, name: 'Pilot', order_no: 2 }
    },
  })

  const activeStage = await prisma.pdStage.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      pipelineId: 2,
      name: 'Active',
      orderNo: 3,
      raw: { id: 5, pipeline_id: 2, name: 'Active', order_no: 3 }
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

