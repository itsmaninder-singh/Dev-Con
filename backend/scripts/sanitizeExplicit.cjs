const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function sanitizeDB() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const resTeam = await db.collection('teams').deleteMany({
    $or: [
      { name: 'ghj' },
      { description: /sex/i }
    ]
  });
  console.log('Deleted explicit teams:', resTeam.deletedCount);

  const resUser1 = await db.collection('users').updateOne(
    { name: /bullshit/i },
    { $set: { name: 'Aman Sharma' } }
  );
  console.log('Cleaned bullshit user name:', resUser1.modifiedCount);

  const resUser2 = await db.collection('users').updateOne(
    { username: /damshit/i },
    { $set: { username: 'gzod_dev' } }
  );
  console.log('Cleaned damshit username:', resUser2.modifiedCount);

  await mongoose.disconnect();
  console.log('Database sanitization complete!');
}

sanitizeDB().catch(console.error);
