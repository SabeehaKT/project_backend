// agendaConfig.js
require('dotenv').config();
const Agenda = require('agenda');

console.log('Loading agendaConfig.js');

const connectionString = process.env.CONNECTION_STRING;
if (!connectionString) {
  throw new Error('CONNECTION_STRING is not defined in .env file');
}

const agenda = new Agenda({
  db: {
    address: connectionString,
    collection: 'reminders',
  },
  processEvery: '1 minute',
});

console.log('Agenda initialized in agendaConfig:', agenda ? 'Success' : 'Failed');
console.log('Connection string:', connectionString);

module.exports = agenda;