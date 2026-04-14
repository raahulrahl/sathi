'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { moderateText } from '@/lib/moderation';

const ProfileSchema = z.object({
  role: z.enum(['family', 'companion']),
  display_name: z.string().trim().min(2).max(60),
  full_name: z.string().trim().max(120).optional().default(''),
  bio: z.string().trim().max(500).optional().default(''),
  languages: z.array(z.string().min(1)).min(1),
  primary_language: z.string().min(1),
  gender: z.string().max(40).optional().default(''),
  photo_url: z.string().url().or(z.literal('')).optional().default(''),
});

export type ProfileBasicsInput = z.infer<typeof ProfileSchema>;

export async function updateOwnProfileAction(input: ProfileBasicsInput) {
  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid profile input.' } as const;
  }
  const supabase = await createSupabaseServerClient();
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Not signed in.' } as const;

  const p = parsed.data;
  if (!p.languages.includes(p.primary_language)) {
    return { ok: false, error: 'Primary language must be one of your languages.' } as const;
  }

  if (p.bio) {
    const mod = await moderateText(p.bio);
    if (mod.flagged) {
      return { ok: false, error: 'Please revise your bio.' } as const;
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      role: p.role,
      display_name: p.display_name,
      full_name: p.full_name || null,
      bio: p.bio || null,
      languages: p.languages,
      primary_language: p.primary_language,
      gender: p.gender || null,
      photo_url: p.photo_url || null,
    })
    .eq('id', userId);

  if (error) return { ok: false, error: error.message } as const;
  revalidatePath('/onboarding');
  revalidatePath(`/profile/${userId}`);
  return { ok: true } as const;
}
