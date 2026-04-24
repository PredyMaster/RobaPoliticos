import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from './client'
import type { AuthResult, SignInPayload, SignUpPayload } from '../../game/types/player'

export async function signUp(payload: SignUpPayload): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        username: payload.username,
        avatar_url: payload.avatarUrl ?? null,
      },
    },
  })

  if (error || !data.session) {
    return { ok: false, error: error?.message ?? 'No session returned after sign-up' }
  }

  return {
    ok: true,
    session: {
      userId: data.session.user.id,
      email: data.session.user.email ?? '',
      accessToken: data.session.access_token,
    },
  }
}

export async function signIn(payload: SignInPayload): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (error || !data.session) {
    return { ok: false, error: error?.message ?? 'Sign-in failed' }
  }

  return {
    ok: true,
    session: {
      userId: data.session.user.id,
      email: data.session.user.email ?? '',
      accessToken: data.session.access_token,
    },
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback)
  return () => data.subscription.unsubscribe()
}
