"use server";

import { redirect } from "next/navigation";

import { authCredentialsSchema } from "@/core/auth/schemas";
import { getServerEnv } from "@/core/config/server-env";
import {
  createServerSupabaseClient,
  setLoginPersistenceCookie,
} from "@/core/db/supabase/server";

export type AuthFormState = {
  error?: string;
  message?: string;
};

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = authCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { APP_OWNER_EMAIL } = getServerEnv();
  if (APP_OWNER_EMAIL && result.data.email.toLowerCase() !== APP_OWNER_EMAIL.toLowerCase()) {
    return { error: "이 개인 앱의 소유자 계정으로만 로그인할 수 있습니다." };
  }

  const rememberLogin = formData.get("rememberLogin") === "on";
  const supabase = await createServerSupabaseClient({ sessionOnly: !rememberLogin });
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: result.data.email,
        options: {
          emailRedirectTo: `${siteUrl}/home`,
        },
      });

      if (resendError) {
        return {
          error: "이메일 인증이 필요합니다. 잠시 후 다시 로그인하면 인증 메일을 다시 보내드릴게요.",
        };
      }

      return {
        message: "인증 메일을 다시 보냈습니다. 스팸함과 프로모션함도 확인해 주세요.",
      };
    }

    return { error: "이메일 또는 비밀번호를 확인해 주세요." };
  }

  await setLoginPersistenceCookie(rememberLogin);
  redirect("/home");
}

export async function signupAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = authCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "입력값을 확인해 주세요." };
  }

  const { APP_OWNER_EMAIL } = getServerEnv();
  if (APP_OWNER_EMAIL && result.data.email.toLowerCase() !== APP_OWNER_EMAIL.toLowerCase()) {
    return { error: "이 개인 앱의 소유자 이메일로만 가입할 수 있습니다." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp(result.data);

  if (error) {
    return { error: "계정을 만들지 못했습니다. 이메일을 확인해 주세요." };
  }

  if (data.session) {
    redirect("/home");
  }

  return { message: "확인 메일을 보냈습니다. 메일의 링크를 눌러 가입을 완료해 주세요." };
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  await setLoginPersistenceCookie(true);
  redirect("/login");
}
