
const cron = require('node-cron');
const ingest = require('./marketIngestion');

cron.schedule('0 9 * * *',()=>{
 console.log("Running ingestion job...");
 ingest();
});
