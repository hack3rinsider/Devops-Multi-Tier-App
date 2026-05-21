const express=require('express');
const amqp=require('amqplib');
const {Pool}=require('pg');

const app=express();

let processedJobs=0;
let failedJobs=0;
let pendingJobs=0;
let lastJob='-';

const activity=[];

function log(msg){

 activity.unshift({
  time:new Date().toLocaleTimeString(),
  message:msg
 });

 if(activity.length>20)
  activity.pop();
}

const pool=new Pool({
 connectionString:process.env.DATABASE_URL
});

async function startWorker(){

 const conn=
 await amqp.connect(
  process.env.RABBITMQ_URL
 );

 const channel=
 await conn.createChannel();

 await channel.assertQueue(
  'report-jobs',
  {durable:true}
 );

 await channel.prefetch(1);

 channel.consume(
 'report-jobs',
 async(msg)=>{

  const job=
  JSON.parse(
   msg.content.toString()
  );

  pendingJobs++;

  log(
   'Worker picked '+job.reportName
  );

  try{

   await pool.query(
   `
   UPDATE reports
   SET job_status='processing'
   WHERE report_name=$1
   `,
   [job.reportName]
   );

   await new Promise(
    r=>setTimeout(r,3000)
   );

   await pool.query(
   `
   UPDATE reports
   SET job_status='completed'
   WHERE report_name=$1
   `,
   [job.reportName]
   );

   processedJobs++;

   await pool.query(
    "UPDATE metrics SET metric_value=metric_value+1 WHERE metric_name='jobs_processed'"
   );

   pendingJobs--;

   lastJob=job.reportName;

   log(
    'Completed '+job.reportName
   );

   channel.ack(msg);

  }catch(err){

   failedJobs++;

   pendingJobs--;

   log(
    'Failed '+job.reportName
   );

   await pool.query(
    "UPDATE metrics SET metric_value=metric_value+1 WHERE metric_name='failed_jobs'"
   );

   channel.nack(msg);

  }

 });

}

startWorker();

app.get('/info',(req,res)=>{

 res.json({
  pendingJobs,
  processedJobs,
  failedJobs,
  lastJob,
  activity
 });

});

app.listen(3003);
