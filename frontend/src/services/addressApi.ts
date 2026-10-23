import { apiFetch } from "./api";

export type AddressType = "Home" | "Work" | "Other";

export interface UserAddress {
  id: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  formattedAddress?: string;
  addressType: AddressType;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressPayload {
  full_name: string;
  phone_number: string;
  alternate_phone_number?: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  postal_code: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  formatted_address?: string;
  address_type: AddressType;
  is_default?: boolean;
}

export type UpdateAddressPayload = CreateAddressPayload;

export interface ReverseGeocodeResult {
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
}

export interface PincodeLocation {
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
}

export async function getAddresses(): Promise<{
  success: boolean;
  addresses: UserAddress[];
}> {
  return apiFetch("/addresses");
}

export async function createAddress(
  payload: CreateAddressPayload,
): Promise<{ success: boolean; address: UserAddress; message?: string }> {
  return apiFetch("/addresses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAddress(
  id: number,
  payload: UpdateAddressPayload,
): Promise<{ success: boolean; address: UserAddress; message?: string }> {
  return apiFetch(`/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAddress(
  id: number,
): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/addresses/${id}`, { method: "DELETE" });
}

export async function setDefaultAddress(
  id: number,
): Promise<{ success: boolean; address: UserAddress; message?: string }> {
  return apiFetch(`/addresses/${id}/default`, { method: "PATCH" });
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<{
  success: boolean;
  address?: ReverseGeocodeResult;
  message?: string;
}> {
  return apiFetch(
    `/addresses/geocode?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`,
  );
}

export async function lookupPincode(
  pincode: string,
): Promise<{ success: boolean; location?: PincodeLocation; message?: string }> {
  return apiFetch(`/addresses/pincode/${encodeURIComponent(pincode)}`);
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

export function getGeolocationErrorMessage(
  err: GeolocationPositionError,
): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location permission denied. Please allow access or enter the address manually.";
    case err.POSITION_UNAVAILABLE:
      return "Location unavailable. Please enter the address manually.";
    case err.TIMEOUT:
      return "Location request timed out. Please try again or enter the address manually.";
    default:
      return "Could not detect location. Please enter the address manually.";
  }
}
