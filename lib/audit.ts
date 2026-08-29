import 'server-only';
import { connectDB } from './db';
import { AuditLog } from './models';
import { getSession } from './session';

interface AuditParams {
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ip?: string;
}

export async function auditLog(params: AuditParams): Promise<void> {
  try {
    const session = await getSession();
    await connectDB();
    await AuditLog.create({
      adminId: session?.adminId ?? 'system',
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ip: params.ip,
    });
  } catch {
    // Audit failures should never break the main operation
  }
}
