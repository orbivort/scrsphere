export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 12,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
  },
  USER: {
    FIRST_NAME_MAX: 50,
    LAST_NAME_MAX: 50,
    EMAIL_MAX: 100,
  },
  CONTENT: {
    TITLE_MAX: 200,
    DESCRIPTION_MAX: 2000,
    MESSAGE_MAX: 5000,
  },
} as const;

export const PASSWORD_REGEX = {
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /[0-9]/,
  SPECIAL_CHAR: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
} as const;
