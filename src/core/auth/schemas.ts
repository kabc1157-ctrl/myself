import { z } from "zod";

export const authCredentialsSchema = z.object({
  email: z.email("이메일 형식을 확인해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});
