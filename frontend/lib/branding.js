"use client";

import { useEffect, useState } from "react";

// Business details printed on client reports (logo, address, phone, website, GSTIN).
// Stored per browser for now; moves to the agency profile once persistence lands.
const STORAGE_KEY = "relvnt-report-details";
const CHANGE_EVENT = "relvnt-report-details-change";

export const EMPTY_REPORT_DETAILS = { logo: "", address: "", phone: "", website: "", gstin: "" };

export const MAX_LOGO_BYTES = 300 * 1024;

// Defaults the app ships with; reports should not go out with these
export const PLACEHOLDER_BRANDING = {
  agencyName: "Your Agency",
  auditorName: "Lead Strategist",
  agencyContact: "audit@youragency.com",
};

const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidGstin(value) {
  return !value || GSTIN_PATTERN.test(value.trim().toUpperCase());
}

export function loadReportDetails() {
  try {
    return { ...EMPTY_REPORT_DETAILS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...EMPTY_REPORT_DETAILS };
  }
}

export function saveReportDetails(details) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useReportDetails() {
  const [details, setDetails] = useState(EMPTY_REPORT_DETAILS);

  useEffect(() => {
    const sync = () => setDetails(loadReportDetails());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return details;
}
