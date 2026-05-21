const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const Redis = require("ioredis");
const amqp = require("amqplib");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

const SERVICE_NAME =
  process.env.SERVICE_NAME || "task-service";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const redis = new Redis(
  process.env.REDIS_URL
);

let channel;

async function connectRabbit() {
  try {
    const connection =
      await amqp.connect(
        process.env.RABBITMQ_URL
      );

    channel =
      await connection.createChannel();

    await channel.assertQueue(
      "report-jobs",
      {
        durable: true
      }
    );

    console.log(
      "RabbitMQ Connected"
    );
  } catch (err) {
    console.error(err);

    setTimeout(
      connectRabbit,
      5000
    );
  }
}

connectRabbit();

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    await redis.ping();

    res.json({
      service: SERVICE_NAME,
      status: "healthy"
    });
  } catch (err) {
    res.status(500).json({
      status: "unhealthy",
      error: err.message
    });
  }
});

app.get("/service-info", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    timestamp: new Date(),
    hostname: SERVICE_NAME
  });
});

app.get("/tasks", async (req, res) => {
  try {
    const start = Date.now();

    const cacheKey = "tasks:list";

    const cached =
      await redis.get(cacheKey);

    if (cached) {
      return res.json({
        source: "redis",
        cache: "HIT",
        responseTime:
          Date.now() - start,
        service: SERVICE_NAME,
        data: JSON.parse(cached)
      });
    }

    const result =
      await pool.query(
        `
        SELECT *
        FROM tasks
        ORDER BY id
        `
      );

    await redis.set(
      cacheKey,
      JSON.stringify(result.rows),
      "EX",
      30
    );

    res.json({
      source: "postgres",
      cache: "MISS",
      responseTime:
        Date.now() - start,
      service: SERVICE_NAME,
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    const result =
      await pool.query(
        `
        INSERT INTO tasks
        (title,status)
        VALUES($1,$2)
        RETURNING *
        `,
        [
          title,
          "pending"
        ]
      );

    await pool.query(
      "UPDATE metrics SET metric_value=metric_value+1 WHERE metric_name='tasks_created'"
    );

    await redis.del(
      "tasks:list"
    );

    await pool.query(
      `
      INSERT INTO audit_logs
      (action,details)
      VALUES($1,$2)
      `,
      [
        "TASK_CREATED",
        title
      ]
    );


    res.json(
      result.rows[0]
    );
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.delete(
  "/tasks/:id",
  async (req, res) => {
    try {
      await pool.query(
        `
        DELETE FROM tasks
        WHERE id=$1
        `,
        [req.params.id]
      );

    await pool.query(
      "UPDATE metrics SET metric_value=metric_value+1 WHERE metric_name='tasks_created'"
    );

      await redis.del(
        "tasks:list"
      );

      res.json({
        success: true
      });
    } catch (err) {
      res.status(500).json({
        error: err.message
      });
    }
  }
);

app.post(
  "/generate-report",
  async (req, res) => {
    try {
      const payload = {
        reportName:
          "System Report",
        created:
          new Date()
      };

      channel.sendToQueue(
        "report-jobs",
        Buffer.from(
          JSON.stringify(payload)
        ),
        {
          persistent: true
        }
      );

      await pool.query(
        `
        INSERT INTO audit_logs
        (action,details)
        VALUES($1,$2)
        `,
        [
          "REPORT_QUEUED",
          payload.reportName
        ]
      );

      await pool.query(
        `
        UPDATE metrics
        SET metric_value =
        metric_value + 1
        WHERE metric_name =
        'reports_generated'
        `
      );

      res.json({
        success: true,
        queue: "report-jobs",
        status: "queued"
      });
    } catch (err) {
      res.status(500).json({
        error: err.message
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(
    `${SERVICE_NAME} running on ${PORT}`
  );
});
