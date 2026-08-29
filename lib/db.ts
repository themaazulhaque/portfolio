import 'server-only';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? '';

// Augment globalThis to persist connection across hot-reloads in development
declare global {
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const cached = globalThis._mongooseCache ?? { conn: null, promise: null };
globalThis._mongooseCache = cached;

/**
 * Connects the *local* mongoose instance and returns it.
 *
 * In Next.js dev (Turbopack) server actions compile into a separate bundle that
 * receives its own `mongoose` module instance, while the RSC bundle populates
 * the globalThis cache with a different instance. Reusing that cached
 * connection while querying through the local (disconnected) instance throws
 * "Connection closed." — so the cache is only reused for the instance that
 * created it.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error('Database connection is not configured.');
  }

  // This instance is already connected (or connecting) — nothing to do.
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose;
  }

  // The cached promise/connection was created by a different mongoose instance.
  if (cached.promise && cached.conn !== mongoose) {
    cached.promise = null;
    cached.conn = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mgs) => {
      return mgs;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return mongoose;
}
