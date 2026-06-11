import { z } from "zod";
import {
  DEPARTMENTS,
  CHENNAI_ZONES,
  ADULT_TSHIRT_SIZES,
  KID_TSHIRT_SIZES,
} from "./constants";

const allTshirtSizes = [...ADULT_TSHIRT_SIZES, ...KID_TSHIRT_SIZES] as const;

export const participantSchema = z.object({
  category: z.enum(["ADULT", "KID"]),
  fullName: z.string().trim().min(1, "Name is required").max(120),
  age: z.coerce.number().int().min(1, "Age is required").max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  tshirtSize: z.enum(allTshirtSizes as unknown as [string, ...string[]]),
});

export const registrationSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(120),
  email: z.string().trim().email("Valid email is required"),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  membership: z.enum(["LIFETIME_MEMBER", "FAMILY_OR_SPOUSE"]),
  batchYear: z.coerce
    .number()
    .int()
    .min(1950, "Enter a valid year")
    .max(2030, "Enter a valid year"),
  department: z.enum(DEPARTMENTS as unknown as [string, ...string[]]),
  chennaiZone: z.enum(CHENNAI_ZONES as unknown as [string, ...string[]]),
  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  area: z.string().trim().min(1, "Area / locality is required").max(120),
  city: z.string().trim().min(1, "City is required").max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  emergencyContactName: z.string().trim().min(1, "Emergency contact name is required").max(120),
  emergencyContactNumber: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit number"),
  medicalConditions: z.string().trim().max(500).optional().or(z.literal("")),
  healthDeclaration: z.literal(true, {
    errorMap: () => ({ message: "Health declaration is required" }),
  }),
  photoConsent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required" }),
  }),
  participants: z.array(participantSchema).min(1, "Add at least one participant"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;
