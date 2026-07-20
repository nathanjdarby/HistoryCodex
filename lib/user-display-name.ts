import type { DISPLAY_NAME_AS_ENUM } from "@/db/schema";

export type DisplayNameAs = (typeof DISPLAY_NAME_AS_ENUM)[number];

export type UserNameFields = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  displayNameAs: DisplayNameAs;
};

function trimOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function emailLocalPart(email: string) {
  return email.split("@")[0] ?? email;
}

export function resolveDisplayName(user: UserNameFields): string {
  const firstName = trimOrNull(user.firstName);
  const lastName = trimOrNull(user.lastName);
  const nickname = trimOrNull(user.nickname);

  switch (user.displayNameAs) {
    case "first_name":
      return firstName ?? emailLocalPart(user.email);
    case "last_name":
      return lastName ?? emailLocalPart(user.email);
    case "nickname":
      return nickname ?? emailLocalPart(user.email);
    case "full_name": {
      const parts = [firstName, lastName].filter(Boolean);
      return parts.length > 0 ? parts.join(" ") : emailLocalPart(user.email);
    }
    default:
      return user.email;
  }
}

export type DisplayNameOption = {
  value: DisplayNameAs;
  label: string;
};

export function displayNameOptions(user: UserNameFields): DisplayNameOption[] {
  const firstName = trimOrNull(user.firstName);
  const lastName = trimOrNull(user.lastName);
  const nickname = trimOrNull(user.nickname);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  const options: DisplayNameOption[] = [{ value: "email", label: user.email }];

  if (firstName) {
    options.push({ value: "first_name", label: firstName });
  }
  if (lastName) {
    options.push({ value: "last_name", label: lastName });
  }
  if (nickname) {
    options.push({ value: "nickname", label: nickname });
  }
  if (fullName) {
    options.push({ value: "full_name", label: fullName });
  }

  return options;
}

export function normalizeDisplayNameAs(
  value: DisplayNameAs,
  user: Pick<UserNameFields, "firstName" | "lastName" | "nickname">,
): DisplayNameAs {
  const options = displayNameOptions({
    email: "",
    displayNameAs: value,
    firstName: user.firstName,
    lastName: user.lastName,
    nickname: user.nickname,
  });
  if (options.some((option) => option.value === value)) {
    return value;
  }
  return "email";
}
