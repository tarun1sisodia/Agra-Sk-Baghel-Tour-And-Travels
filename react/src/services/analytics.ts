export type ConversionEventName =
  | "phone_click"
  | "whatsapp_click"
  | "booking_form_start"
  | "vehicle_selected"
  | "booking_form_submit"
  | "booking_request_success"
  | "payment_success";

type ConversionParams = Record<string, string | number | boolean | undefined>;

function cleanParams(params: ConversionParams): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  ) as Record<string, string | number | boolean>;
}

export function trackConversion(name: ConversionEventName, params: ConversionParams = {}): void {
  if (typeof window === "undefined") return;
  const eventParams = cleanParams(params);
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", name, eventParams);
  }
  window.dispatchEvent(new CustomEvent("skb:conversion", { detail: { name, params: eventParams } }));
}

export function installConversionAnalytics(): () => void {
  if (typeof document === "undefined") return () => undefined;
  let bookingStarted = false;
  const onFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest("[data-booking-form], #home-booking-widget") || bookingStarted) return;
    bookingStarted = true;
    trackConversion("booking_form_start", { entry_point: window.location.pathname });
  };
  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const link = target?.closest<HTMLAnchorElement>("a[href]");
    if (link?.href.startsWith("tel:")) {
      trackConversion("phone_click", { placement: link.dataset.analyticsPlacement || "link" });
    } else if (link?.href.includes("wa.me")) {
      trackConversion("whatsapp_click", { placement: link.dataset.analyticsPlacement || "link" });
    }
    const vehicle = target?.closest<HTMLElement>("[data-vehicle-group]");
    if (vehicle) {
      trackConversion("vehicle_selected", { vehicle_group: vehicle.dataset.vehicleGroup });
    }
  };
  const onSubmit = (event: SubmitEvent) => {
    const form = event.target as HTMLFormElement | null;
    if (form?.matches("[data-booking-form]")) {
      trackConversion("booking_form_submit", { category: form.dataset.category });
    }
  };
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("click", onClick);
  document.addEventListener("submit", onSubmit);
  return () => {
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("click", onClick);
    document.removeEventListener("submit", onSubmit);
  };
}
