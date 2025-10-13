"use server";

import { validatedAction } from "@/lib/action-helpers";
import { auth } from "@/lib/auth";
import { LoginSchema, SignUpSchema } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export const signUpEmail = validatedAction(SignUpSchema, async (data) => {
  const { email, password, firstName, lastName, role } = data;

  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: `${firstName} ${lastName}`,
    },
  });

  // Update user with role
  if (result?.user?.id) {
    await prisma.user.update({
      where: { id: result.user.id },
      data: { role },
    });
  }

  return { success: true };
});

export const loginEmail = validatedAction(LoginSchema, async (data) => {
  const { email, password } = data;

  await auth.api.signInEmail({
    body: { email, password },
  });

  return { success: true };
});