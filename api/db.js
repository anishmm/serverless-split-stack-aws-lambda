const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const db_connection = process.env.MONGO_DB_CONNECTION;
let isConnected;


module.exports = connectToDatabase = () => {

  if (isConnected) {
    console.log('=> using existing database connection');
    return Promise.resolve();
  }

  console.log('=> using new database connection');
  console.log('=> ', db_connection);

  return mongoose.connect(db_connection)
    .then(db => {
      isConnected = db.connections[0].readyState;
    });
};

