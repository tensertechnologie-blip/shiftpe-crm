import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import { User } from './models/User.js';
import { runSeed } from './scripts/seed.js';

async function backgroundConnectLoop(): Promise<void> {
  let attempt = 1;
  while (true) {
    try {
      console.log(`[Database] Attempting to connect to MongoDB Atlas (attempt ${attempt})...`);
      await connectDB();
      console.log('[Database] Connected to MongoDB Atlas successfully!');

      // Check if CEO exists, if not auto-seed
      const ceoExists = await User.findOne({ email: config.ceo.email });
      if (!ceoExists) {
        console.log('[Database] CEO account not found, running database seed...');
        await runSeed();
      }
      break;
    } catch (err: any) {
      console.warn(`[Database] Connection attempt ${attempt} failed: ${err.message}`);
      console.warn(`[Database] If you see IP whitelist errors, add your IP in MongoDB Atlas -> Security -> Network Access.`);
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, 6000));
    }
  }
}

async function bootstrap() {
  const app = createApp();

  app.listen(config.port, () => {
    console.log(`[ShiftPe API] Server listening on http://localhost:${config.port}`);
    console.log(`[ShiftPe API] Client origin: ${config.clientOrigin}`);
    backgroundConnectLoop().catch((err) => console.error('Connection loop error:', err));
  });
}

bootstrap();
