import 'server-only';
import { revalidatePath, updateTag } from 'next/cache';

/**
 * Invalidates every public CMS-backed route after any admin mutation so the
 * portfolio reflects the change on the next request. The public pages are
 * server-rendered on demand, but this also clears any production route/data
 * caches as a safety net.
 */
export function revalidateSite(): void {
  revalidatePath('/', 'layout');
  updateTag('cms');
}
