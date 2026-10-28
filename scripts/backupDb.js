import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/khelnow';

async function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(process.cwd(), 'backups', timestamp);

  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`\n📦 Starting JSON database backup for: ${mongoUri}`);
  console.log(`📁 Backup target directory: ${backupDir}\n`);

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  let totalBytes = 0;
  const summary = [];

  for (const collInfo of collections) {
    const name = collInfo.name;
    const docs = await db.collection(name).find({}).toArray();
    const filePath = path.join(backupDir, `${name}.json`);
    const jsonString = JSON.stringify(docs, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf8');

    const stat = fs.statSync(filePath);
    totalBytes += stat.size;
    summary.push({
      collection: name,
      documents: docs.length,
      file: `${name}.json`,
      sizeBytes: stat.size
    });
    console.log(`   Exported ${name}: ${docs.length} document(s) (${(stat.size / 1024).toFixed(2)} KB)`);
  }

  // Also write metadata.json
  const metadata = {
    timestamp: new Date().toISOString(),
    sourceUri: mongoUri,
    database: db.databaseName,
    collections: summary,
    totalSizeBytes: totalBytes
  };
  fs.writeFileSync(path.join(backupDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');

  await mongoose.disconnect();

  console.log(`\n✅ Backup complete!`);
  console.log(`   Path: ${backupDir}`);
  console.log(`   Total Size: ${(totalBytes / 1024).toFixed(2)} KB (${totalBytes} bytes) across ${summary.length} collections.\n`);

  return { backupDir, totalBytes, summary };
}

performBackup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
