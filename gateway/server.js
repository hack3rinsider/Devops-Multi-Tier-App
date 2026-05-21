const express = require('express');
const { Pool } = require('pg');

const app = express();

app.use(express.json());

app.use(async(req,res,next)=>{
  try{
    await pool.query("UPDATE metrics SET metric_value=metric_value+1 WHERE metric_name='total_requests'");
  }catch(e){}
  next();
});


const PORT = process.env.PORT || 3000;

const AUTH_URL =
  process.env.AUTH_URL ||
  'http://auth-service:3001';

const TASK_SERVICE_URL =
  process.env.TASK_SERVICE_URL ||
  'http://task-service-1:3002';


const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://devops:devops123@postgres:5432/devopsdb'
});

app.get('/health',(req,res)=>{
  res.json({
    service:'gateway',
    status:'healthy'
  });
});

app.get('/api/health',(req,res)=>{
  res.json({
    service:'gateway',
    status:'healthy',
    timestamp:new Date()
  });
});

app.get('/api/database/users',verifyToken,async(req,res)=>{
  try{
    const result=await pool.query(
      `
      SELECT
      id,
      username,
      role,
      created_at
      FROM users
      ORDER BY id
      `
    );
    res.json(result.rows);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

app.get('/api/database/tasks',verifyToken,async(req,res)=>{
  try{
    const result=await pool.query(
      'SELECT * FROM tasks ORDER BY id'
    );
    res.json(result.rows);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

app.get('/api/database/reports',verifyToken,async(req,res)=>{
  try{
    const result=await pool.query(
      'SELECT * FROM reports ORDER BY id'
    );
    res.json(result.rows);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

app.get('/api/database/audit_logs',async(req,res)=>{
  try{
    const result=await pool.query(
      'SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100'
    );
    res.json(result.rows);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

app.get('/api/database/:table',async(req,res)=>{
  try{

    const allowed=[
      'users',
      'tasks',
      'reports',
      'audit_logs',
      'metrics'
    ];

    const table=req.params.table;

    if(!allowed.includes(table)){
      return res.status(400).json({
        error:'invalid table'
      });
    }

    const result=await pool.query(
      `SELECT * FROM ${table} LIMIT 100`
    );

    res.json(result.rows);

  }catch(err){
    res.status(500).json({
      error:err.message
    });
  }
});

app.get('/api/metrics',verifyToken,verifyAdmin,async(req,res)=>{
  try{
    const result=await pool.query(
      'SELECT * FROM metrics'
    );
    res.json(result.rows);
  }catch(err){
    res.status(500).json({
      error:err.message
    });
  }
});

app.listen(PORT,()=>{
  console.log('gateway running');
});

const Redis = require('ioredis');

let redis = new Redis(
  process.env.REDIS_URL || 'redis://redis:6379',
  {
    maxRetriesPerRequest:1,
    enableReadyCheck:false,
    retryStrategy:(times)=>{
      if(times>5) return null;
      return 1000;
    }
  }
);

redis.on('error',()=>{});


app.get('/api/cache/tasks', async (req,res)=>{

  const start = Date.now();

  const cacheKey='tasks:list';

  try{

    const cached=await redis.get(cacheKey);

    if(cached){

      await pool.query(
        "UPDATE metrics SET metric_value=metric_value+1 WHERE metric_name='cache_hits'"
      );

      return res.json({
        source:'redis',
        cache:'HIT',
        responseTime:Date.now()-start,
        data:JSON.parse(cached)
      });

    }

    const result=await pool.query(
      'SELECT * FROM tasks ORDER BY id'
    );

    await pool.query(
      "UPDATE metrics SET metric_value=metric_value+1 WHERE metric_name='cache_misses'"
    );

    await redis.set(
      cacheKey,
      JSON.stringify(result.rows),
      'EX',
      60
    );

    return res.json({
      source:'postgres',
      cache:'MISS',
      responseTime:Date.now()-start,
      data:result.rows
    });

  }catch(err){

    res.status(500).json({
      error:err.message
    });

  }

});

app.post('/api/cache/clear',async(req,res)=>{

  await redis.del('tasks:list');

  res.json({
    success:true,
    message:'cache cleared'
  });

});

const amqp=require('amqplib');

let rabbitChannel;

(async()=>{

 try{

  const conn=
   await amqp.connect(
    process.env.RABBITMQ_URL
   );

  rabbitChannel=
   await conn.createChannel();

  await rabbitChannel.assertQueue(
   'report-jobs',
   {durable:true}
  );

 }catch(err){

  console.error(err);

 }

})();

app.post(
 '/api/reports/generate',
 async(req,res)=>{

  const payload={
   reportName:
   'Generated Report '+
   Date.now()
  };

  await pool.query(
   `
   INSERT INTO reports
   (
    report_name,
    status,
    job_status
   )
   VALUES(
    $1,
    'queued',
    'queued'
   )
   `,
   [payload.reportName]
  );

  await pool.query(
   "UPDATE metrics SET metric_value=metric_value+1 WHERE metric_name='reports_generated'"
  );

  rabbitChannel.sendToQueue(
   'report-jobs',
   Buffer.from(
    JSON.stringify(payload)
   )
  );

  res.json({
   queued:true,
   payload
  });

 });

app.get(
 '/api/worker/info',
 async(req,res)=>{

  const result=
   await fetch(
    'http://worker-service:3003/info'
   );

  const data=
   await result.json();

  res.json(data);

 });



app.post('/api/auth/register', async (req,res)=>{

  try{

    const response = await fetch(
      AUTH_URL + '/register',
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify(req.body)
      }
    );

    const data = await response.json();

    res.status(response.status).json(data);

  }catch(err){

    res.status(500).json({
      error:err.message
    });

  }

});

app.post('/api/auth/login', async (req,res)=>{

  try{

    const response = await fetch(
      AUTH_URL + '/login',
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify(req.body)
      }
    );

    const data = await response.json();

    res.status(response.status).json(data);

  }catch(err){

    res.status(500).json({
      error:err.message
    });

  }

});

app.get('/api/auth/verify', async (req,res)=>{

  try{

    const response = await fetch(
      AUTH_URL + '/verify',
      {
        headers:{
          Authorization:
          req.headers.authorization || ''
        }
      }
    );

    const data = await response.json();

    res.status(response.status).json(data);

  }catch(err){

    res.status(500).json({
      error:err.message
    });

  }

});


app.get('/api/system/health', async (req,res)=>{

  const status={
    gateway:'UP',
    postgres:'DOWN',
    redis:'DOWN',
    rabbitmq:'UNKNOWN',
    worker:'DOWN',
    auth:'DOWN',
    timestamp:new Date()
  };

  try{
    await pool.query('SELECT 1');
    status.postgres='UP';
  }catch(e){}

  try{

    const pong = await Promise.race([
      redis.ping(),
      new Promise((_,reject)=>
        setTimeout(
          ()=>reject(new Error('timeout')),
          1000
        )
      )
    ]);

    if(pong==='PONG')
      status.redis='UP';

  }catch(e){
    status.redis='DOWN';
  }

  try{
    const r=await fetch('http://worker-service:3003/info');
    if(r.ok) status.worker='UP';
  }catch(e){}

  try{
    const r=await fetch(AUTH_URL+'/health');
    if(r.ok) status.auth='UP';
  }catch(e){}

  try{

    const testConn =
      await Promise.race([
        amqp.connect(
          process.env.RABBITMQ_URL
        ),
        new Promise((_,reject)=>
          setTimeout(
            ()=>reject(new Error('timeout')),
            1000
          )
        )
      ]);

    await testConn.close();

    status.rabbitmq='UP';

  }catch(e){

    status.rabbitmq='DOWN';

  }

  res.json(status);

});


app.get('/api/reports/stats', async (req,res)=>{

  try{

    const queued = await pool.query(
      "SELECT COUNT(*) FROM reports WHERE job_status='queued'"
    );

    const processing = await pool.query(
      "SELECT COUNT(*) FROM reports WHERE job_status='processing'"
    );

    const completed = await pool.query(
      "SELECT COUNT(*) FROM reports WHERE job_status='completed'"
    );

    const failed = await pool.query(
      "SELECT COUNT(*) FROM reports WHERE job_status='failed'"
    );

    res.json({
      queued:Number(queued.rows[0].count),
      processing:Number(processing.rows[0].count),
      completed:Number(completed.rows[0].count),
      failed:Number(failed.rows[0].count)
    });

  }catch(err){

    res.status(500).json({
      error:err.message
    });

  }

});


app.post('/api/reports/generate-bulk', async (req,res)=>{

  const count=Number(req.query.count || 50);

  for(let i=0;i<count;i++){

    const payload={
      reportName:
      'Generated Report '+
      Date.now()+'-'+i
    };

    await pool.query(
      `
      INSERT INTO reports
      (
        report_name,
        status,
        job_status
      )
      VALUES
      (
        $1,
        'queued',
        'queued'
      )
      `,
      [payload.reportName]
    );

    await pool.query(
      "UPDATE metrics SET metric_value=metric_value+1 WHERE metric_name='reports_generated'"
    );

    rabbitChannel.sendToQueue(
      'report-jobs',
      Buffer.from(JSON.stringify(payload))
    );

  }

  res.json({
    queued:true,
    count
  });

});

async function verifyToken(req,res,next){

  try{

    const auth=req.headers.authorization;

    if(!auth){
      return res.status(401).json({
        error:'token required'
      });
    }

    const response=await fetch(
      AUTH_URL+'/verify',
      {
        headers:{
          Authorization:auth
        }
      }
    );

    const data=await response.json();

    if(!response.ok){
      return res.status(401).json(data);
    }

    req.user=data.decoded;

    next();

  }catch(err){

    res.status(401).json({
      error:'invalid token'
    });

  }

}

function verifyAdmin(req,res,next){

  if(req.user?.role!=='admin'){
    return res.status(403).json({
      error:'admin only'
    });
  }

  next();

}

