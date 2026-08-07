import { getRuntimeEnv } from "@/db";
import { bytesToBase64Url, constantTimeEqual } from "./encoding";

const SESSION_SECONDS = 12 * 60 * 60;

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function verifyPassword(candidate: string) {
  const password = getRuntimeEnv().STATUS_PASSWORD;
  return Boolean(password && constantTimeEqual(candidate, password));
}

export async function verifyOrdersPassword(candidate: string) {
  const password = getRuntimeEnv().ORDERS_PASSWORD;
  return Boolean(password && constantTimeEqual(candidate, password));
}

export async function createSessionCookie() {
  const secret = getRuntimeEnv().SESSION_SIGNING_SECRET;
  if (!secret) throw new Error("Status session signing is not configured.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `status.${expires}`;
  const signature = await sign(payload, secret);
  return `mb_status_session=${payload}.${signature}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}


export async function createOrdersSessionCookie() {
  const secret = getRuntimeEnv().SESSION_SIGNING_SECRET;
  if (!secret) throw new Error("Order session signing is not configured.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `orders.${expires}`;
  return `mb_orders_session=${payload}.${await sign(payload, secret)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export async function isAdminRequest(request: Request) {
  const secret = getRuntimeEnv().SESSION_SIGNING_SECRET;
  if (!secret) return false;
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith("mb_status_session="))
    ?.slice("mb_status_session=".length);
  if (!value) return false;
  const [scope, expiryText, signature] = value.split(".");
  const expiry = Number(expiryText);
  if (scope !== "status" || !Number.isFinite(expiry) || expiry < Date.now() / 1000 || !signature) return false;
  const expected = await sign(`${scope}.${expiryText}`, secret);
  return constantTimeEqual(signature, expected);
}


export async function isOrdersAdminRequest(request: Request) {
  const secret = getRuntimeEnv().SESSION_SIGNING_SECRET;
  if (!secret) return false;
  const value = (request.headers.get("cookie") ?? "").split(";").map(part => part.trim())
    .find(part => part.startsWith("mb_orders_session="))?.slice("mb_orders_session=".length);
  if (!value) return false;
  const [scope, expiryText, signature] = value.split(".");
  const expiry = Number(expiryText);
  if (scope !== "orders" || !Number.isFinite(expiry) || expiry < Date.now() / 1000 || !signature) return false;
  return constantTimeEqual(signature, await sign(`${scope}.${expiryText}`, secret));
}

export function clearSessionCookie() {
  return `mb_status_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export function clearOrdersSessionCookie() {
  return `mb_orders_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
