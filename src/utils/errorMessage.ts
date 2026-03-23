export const getErrorMessage = (errorCode: string): string => {
 const errorMessages: Record<string, string> = {
      "USER_NOT_FOUND": "No account found with this email address. Please sign up first.",
      "INVALID_PASSWORD": "Incorrect password. Please try again.",
      "EMAIL_NOT_VERIFIED": "Please verify your email before logging in. Check your inbox for the verification link. If you didn't receive the email, please request a new verification link.",
      "ACCOUNT_DEACTIVATED": "Your account has been deactivated. Please contact support for assistance.",
      "PASSWORD_NOT_SET": "Your account doesn't have a password set. Please use the 'Forgot Password' option to create a new password.",
      "INVALID_CREDENTIALS_FORMAT": "Please enter a valid email address and password.",
      "CredentialsSignin": "Invalid email or password. Please check your credentials and try again.",
    };

    return errorMessages[errorCode] || "An error occurred during sign in. Please try again.";
  };