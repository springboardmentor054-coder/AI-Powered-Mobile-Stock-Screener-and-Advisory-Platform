require('dotenv').config();
const { populateShareholdingTable } = require('./populateDatabase');

async function updateShareholding() {
  try {
    console.log('Starting shareholding update...\n');
    await populateShareholdingTable();
    console.log('\n✅ Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateShareholding();
