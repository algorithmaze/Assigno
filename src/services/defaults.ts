// src/services/defaults.ts
import type { SchoolDetails } from './school'; // Type-only import
import { OTP_BYPASS_ADMIN_EMAIL } from './otp';

export const DEFAULT_TEST_SCHOOL_CONST: SchoolDetails = {
  schoolCode: "KV5287",
  schoolName: "Kendriya Vidyalaya Test School",
  instituteType: "School",
  address: "Knowledge Park III",
  city: "Test City",
  state: "Test State",
  pincode: "123456",
  contactNumber: "+919999988888",
  adminEmail: OTP_BYPASS_ADMIN_EMAIL, // This will be the admin email for the default school
  registrationDate: new Date("2024-01-01T10:00:00.000Z").toISOString(),
};
