import { useEffect, useState, useMemo, useRef } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  CreditCard,
  Info,
  Layers,
  MapPin,
  Moon,
  Navigation,
  Phone,
  RefreshCw,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  fetchPublishedCatalog,
  getFallbackPublishedCatalog,
  fetchQuoteOptions,
  createBooking,
  createBookingPayment,
  verifyBookingPayment,
  CleanFareApiError,
} from "../../../services/cleanFareApi";
import { loadRazorpayScript } from "../razorpay";
import {
  toIstISOString,
  getDefaultPickupDate,
  getDefaultReturnDate,
  getTodayIstDate,
} from "./dateTime";
import { normalizeBookingUrlParams } from "./urlNormalizer";
import { useLocationIQ } from "../../../hooks/useLocationIQ";
import { useCustomerAuth } from "../../../auth/customerAuth";
import type {
  CustomerFormState,
  SelectedCarState,
  ReconfirmationState,
} from "./bookingTypes";
import type {
  CategoryCode,
  PublishedCatalogResponse,
  PublishedProductSummary,
  OptionsResponse,
  OptionsVehicleItem,
  QuoteResponse,
} from "../../../contracts/fare-system";

function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function isValidUuid(id: string | null | undefined): boolean {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

const CATEGORIES: { code: CategoryCode; label: string }[] = [
  { code: "outstation", label: "Outstation Cabs" },
  { code: "local_package", label: "Local Sightseeing" },
  { code: "transfer", label: "Airport / Station Transfers" },
  { code: "tour_package", label: "Tour Packages" },
];

const MONUMENT_TO_PACKAGE_MAP: Record<string, string> = {
  "taj-mahal": "taj-mahal-sightseeing",
  "taj mahal": "taj-mahal-sightseeing",
  "agra-fort": "agra-fort-taj-tour",
  "agra fort": "agra-fort-taj-tour",
  "agra-red-fort": "agra-fort-taj-tour",
  "fatehpur-sikri": "fatehpur-sikri-tour",
  "fatehpur sikri": "fatehpur-sikri-tour",
  "itmad-ud-daulah": "baby-taj-mehtab-bagh",
  "itmad-ud-daulah-baby-taj": "baby-taj-mehtab-bagh",
  "baby-taj": "baby-taj-mehtab-bagh",
  "baby taj": "baby-taj-mehtab-bagh",
  "mehtab-bagh": "baby-taj-mehtab-bagh",
  "mehtab bagh": "baby-taj-mehtab-bagh",
  "sikandra": "agra-standard-sightseeing",
  "sikandra-akbar-tomb": "agra-standard-sightseeing",
  "akbar's tomb": "agra-standard-sightseeing",
  "aram-bagh": "agra-standard-sightseeing",
  "aram bagh": "agra-standard-sightseeing",
  "ram bagh": "agra-standard-sightseeing",
  "same-day-tour-of-fatehpur-sikri": "fatehpur-sikri-tour",
  "same-day-fatehpur-sikri": "fatehpur-sikri-tour",
  "gatimaan-express": "gatimaan-express-agra-tour",
  "golden-triangle-3d": "golden-triangle",
  "agra-unhurried": "agra-sightseeing",
  "same-day-agra-tour": "agra-sightseeing",
  "agra-8h-80km": "agra-fort-heritage-tour",
  "ram-bagh-to-sikandra-tour": "agra-fort-heritage-tour",
};

function resolveProductFromCatalog(
  cat: PublishedCatalogResponse,
  targetCategory: CategoryCode,
  productParam: string,
  fromParam: string,
  toParam: string
): { category: CategoryCode; code: string } {
  let matchedProduct: PublishedProductSummary | undefined;
  const cleanParam = productParam.replace(/-(?:taxi|services|service)$/i, "").trim().toLowerCase();

  if (cleanParam) {
    const mappedCode = (MONUMENT_TO_PACKAGE_MAP[cleanParam] || MONUMENT_TO_PACKAGE_MAP[productParam] || cleanParam).toLowerCase();
    matchedProduct = cat.products.find(
      (p) =>
        p.code.toLowerCase() === mappedCode ||
        p.id.toLowerCase() === mappedCode ||
        p.code.toLowerCase() === cleanParam ||
        p.id.toLowerCase() === productParam.toLowerCase()
    );

    if (!matchedProduct) {
      matchedProduct = cat.products.find((p) => {
        const pCode = p.code.toLowerCase();
        return (
          pCode === cleanParam ||
          pCode.replace(/-/g, "").includes(cleanParam.replace(/-/g, "")) ||
          cleanParam.replace(/-/g, "").includes(pCode.replace(/-/g, ""))
        );
      });
    }
  }

  if (!matchedProduct && (toParam || (fromParam && toParam))) {
    const mappedFromTo = MONUMENT_TO_PACKAGE_MAP[toParam.trim().toLowerCase()];
    if (mappedFromTo) {
      matchedProduct = cat.products.find((p) => p.code.toLowerCase() === mappedFromTo);
    }
    if (!matchedProduct && fromParam && toParam) {
      matchedProduct = cat.products.find((p) => {
        const pCode = p.code.toLowerCase();
        const pName = p.name.toLowerCase();
        return (
          (pCode.includes(fromParam) && pCode.includes(toParam)) ||
          (pName.includes(fromParam) && pName.includes(toParam))
        );
      });
    }
    if (!matchedProduct && toParam) {
      matchedProduct = cat.products.find((p) => {
        const pCode = p.code.toLowerCase();
        const pName = p.name.toLowerCase();
        return pCode.includes(toParam) || pName.includes(toParam);
      });
    }
  }

  if (matchedProduct) {
    return { category: matchedProduct.category, code: matchedProduct.code };
  }

  const availableInCat = cat.products.filter((p) => p.category === targetCategory);
  if (availableInCat.length > 0) {
    return { category: targetCategory, code: availableInCat[0].code };
  }
  if (cat.products.length > 0) {
    return { category: cat.products[0].category, code: cat.products[0].code };
  }
  return { category: targetCategory, code: "" };
}

export function CleanBookingPage() {
  // 1. Initial State from URL Search Params
  const searchParams = useMemo(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }, []);

  const normalizedParams = useMemo(() => normalizeBookingUrlParams(searchParams), [searchParams]);

  const initialCategory = normalizedParams.category;
  const initialTripType = normalizedParams.trip;
  const initialPassengers = normalizedParams.pax;
  const initialProductParam = (normalizedParams.product || "").toLowerCase();
  const initialFrom = (normalizedParams.from || "").toLowerCase();
  const initialTo = (normalizedParams.to || "").toLowerCase();
  const initialVehicle = (normalizedParams.car || "").toLowerCase();

  // 2. Synchronous Baseline Catalog for Instant Zero-Flash Interaction
  const baselineCatalog = useMemo(() => getFallbackPublishedCatalog(), []);
  const initialSelection = useMemo(
    () => resolveProductFromCatalog(baselineCatalog, initialCategory, initialProductParam, initialFrom, initialTo),
    [baselineCatalog, initialCategory, initialProductParam, initialFrom, initialTo]
  );

  const [catalog, setCatalog] = useState<PublishedCatalogResponse>(baselineCatalog);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [category, setCategory] = useState<CategoryCode>(initialSelection.category);
  const [selectedProductCode, setSelectedProductCode] = useState<string>(initialSelection.code);
  const [unmatchedRouteError, setUnmatchedRouteError] = useState<string | null>(null);
  const [tripType, setTripType] = useState<"one_way" | "round_trip">(initialTripType);
  const [passengerCount, setPassengerCount] = useState<number>(initialPassengers);

  // Date and Time (IST)
  const [pickupDate, setPickupDate] = useState<string>(
    normalizedParams.date || getDefaultPickupDate()
  );
  const [pickupTime, setPickupTime] = useState<string>(normalizedParams.time || "09:00");
  const [returnDate, setReturnDate] = useState<string>(
    normalizedParams.return_date ||
      getDefaultReturnDate(normalizedParams.date || getDefaultPickupDate(), 1)
  );
  const [returnTime, setReturnTime] = useState<string>(normalizedParams.return_time || "18:00");

  // 3. Live Quote Options State
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // 4. Selected Vehicle
  const [selectedCar, setSelectedCar] = useState<SelectedCarState | null>(null);

  // 5. Customer Details Form & Google Auth Pre-fill
  const { user, accessToken } = useCustomerAuth();
  const [customer, setCustomer] = useState<CustomerFormState>({
    name: searchParams.get("name") || "",
    phone: searchParams.get("phone") || "",
    email: searchParams.get("email") || "",
    pickup_address: searchParams.get("pickup") || searchParams.get("pickup_address") || "",
    drop_address: searchParams.get("drop") || searchParams.get("drop_address") || "",
    flight_train_number: searchParams.get("flight") || "",
    notes: searchParams.get("notes") || "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata as Record<string, any> | undefined;
      const fullName =
        metadata?.full_name ||
        metadata?.name ||
        (user.email ? user.email.split("@")[0] : "");
      setCustomer((prev) => ({
        ...prev,
        name: prev.name.trim() ? prev.name : (fullName || ""),
        email: prev.email.trim() ? prev.email : (user.email || ""),
      }));
    }
  }, [user]);

  // 6. Booking & Payment Execution State
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    booking_id: string;
    ticket_id: string;
    advance_amount: number;
    total_amount: number;
  } | null>(null);

  // 7. LocationIQ Address Autocomplete
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const pickupWrapperRef = useRef<HTMLDivElement | null>(null);
  const dropWrapperRef = useRef<HTMLDivElement | null>(null);

  const pickupLocationIQ = useLocationIQ("", {
    debounceMs: 300,
    minQueryLength: 2,
  });

  const dropLocationIQ = useLocationIQ("", {
    debounceMs: 300,
    minQueryLength: 2,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickupWrapperRef.current && !pickupWrapperRef.current.contains(e.target as Node)) {
        setShowPickupSuggestions(false);
      }
      if (dropWrapperRef.current && !dropWrapperRef.current.contains(e.target as Node)) {
        setShowDropSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 8. 409 Price Reconfirmation Modal
  const [reconfirmation, setReconfirmation] = useState<ReconfirmationState>({
    isOpen: false,
    freshQuote: {} as QuoteResponse,
    oldTotal: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Revalidate with live database catalog in background
  useEffect(() => {
    let active = true;
    fetchPublishedCatalog()
      .then((data) => {
        if (!active) return;
        setCatalog(data);

        // Keep current product if still present in live catalog, otherwise re-resolve
        const resolved = resolveProductFromCatalog(data, initialCategory, initialProductParam, initialFrom, initialTo);
        setCategory((prevCat) => {
          const catExists = data.products.some((p) => p.category === prevCat);
          return catExists ? prevCat : resolved.category;
        });
        setSelectedProductCode((prevCode) => {
          const codeExists = data.products.some((p) => p.code === prevCode);
          return codeExists ? prevCode : resolved.code;
        });
        setUnmatchedRouteError(null);
      })
      .catch((err) => {
        console.warn("fetchPublishedCatalog background refresh warning:", err);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialCategory, initialProductParam, initialFrom, initialTo]);

  // Update selected product when category changes
  const productsInCategory = useMemo(() => {
    if (!catalog) return [];
    return catalog.products.filter((p) => p.category === category);
  }, [catalog, category]);

  useEffect(() => {
    if (unmatchedRouteError) {
      return;
    }
    if (productsInCategory.length > 0) {
      if (!selectedProductCode || !productsInCategory.some((p) => p.code === selectedProductCode)) {
        setSelectedProductCode(productsInCategory[0].code);
      }
    } else {
      setSelectedProductCode("");
    }
  }, [category, productsInCategory, selectedProductCode, unmatchedRouteError]);

  // Active product summary
  const activeProduct = useMemo<PublishedProductSummary | null>(() => {
    if (!catalog) return null;
    return catalog.products.find((p) => p.category === category && p.code === selectedProductCode) || null;
  }, [catalog, category, selectedProductCode]);

  // 8. Fetch Quote Options whenever parameters change
  useEffect(() => {
    if (!activeProduct) {
      setOptions(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setOptionsLoading(true);
    setOptionsError(null);
    setOptions(null);
    setSelectedCar(null);

    const pickup_at = toIstISOString(pickupDate, pickupTime);
    const return_at =
      category === "outstation" && tripType === "round_trip"
        ? toIstISOString(returnDate, returnTime)
        : undefined;

    const requestPayload: any = {
      category,
      passenger_count: passengerCount,
      pickup_at,
    };

    if (category === "outstation") {
      requestPayload.route_id = activeProduct.id;
      requestPayload.trip_type = tripType;
      if (return_at) {
        requestPayload.return_at = return_at;
      }
    } else if (category === "local_package") {
      requestPayload.local_package_id = activeProduct.id;
    } else if (category === "transfer") {
      requestPayload.transfer_id = activeProduct.id;
    } else if (category === "tour_package") {
      requestPayload.tour_package_id = activeProduct.id;
    }

    const pickupInstant = Date.parse(pickup_at);
    if (!Number.isFinite(pickupInstant) || pickupInstant <= Date.now()) {
      setOptionsError("Pickup date and time must be in the future.");
      setOptionsLoading(false);
      return () => controller.abort();
    }
    if (return_at && (!Number.isFinite(Date.parse(return_at)) || Date.parse(return_at) <= pickupInstant)) {
      setOptionsError("Return date and time must be later than pickup.");
      setOptionsLoading(false);
      return () => controller.abort();
    }

    fetchQuoteOptions(requestPayload)
      .then((data) => {
        if (controller.signal.aborted) return;
        setOptions(data);

        // Auto-select first car or preserve previous selection if present in returned options
        const allVehicles = data.groups.flatMap((g) => g.vehicles);
        if (allVehicles.length > 0) {
          setSelectedCar((prev) => {
            if (prev) {
              const matched = allVehicles.find((v) => v.vehicle_model_id === prev.vehicle.vehicle_model_id);
              if (matched) return { vehicle: matched, quote: matched.quote };
            }
            if (initialVehicle) {
              const cleanInitial = initialVehicle.replace(/[-_]/g, "").toLowerCase();
              const vehicleMatch = allVehicles.find((v) => {
                const group = v.quote.vehicle.group_code.toLowerCase();
                const cleanGroup = group.replace(/[-_]/g, "");
                const name = v.display_name.toLowerCase();
                const modelId = (v.vehicle_model_id || "").toLowerCase();
                return (
                  group === initialVehicle ||
                  cleanGroup.includes(cleanInitial) ||
                  cleanInitial.includes(cleanGroup) ||
                  name.includes(initialVehicle) ||
                  name.replace(/[-_]/g, "").includes(cleanInitial) ||
                  modelId === initialVehicle
                );
              });
              if (vehicleMatch) return { vehicle: vehicleMatch, quote: vehicleMatch.quote };
            }
            return { vehicle: allVehicles[0], quote: allVehicles[0].quote };
          });
        } else {
          setSelectedCar(null);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof CleanFareApiError) {
          if (err.code === "TRIP_TOO_LONG") {
            setOptionsError("Trip duration exceeds the maximum allowable calendar days for self-service booking. Please adjust return date.");
          } else if (err.code === "VEHICLE_NOT_AVAILABLE") {
            setOptionsError("No commercial vehicles available for the selected group or passenger count.");
          } else {
            setOptionsError(err.message || "Failed to calculate quote options.");
          }
        } else {
          setOptionsError("Failed to reach the fare server. Please check your internet connection.");
        }
        setOptions(null);
        setSelectedCar(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setOptionsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    activeProduct?.id,
    category,
    tripType,
    passengerCount,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
  ]);

  // Form Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customer.name.trim()) errs.name = "Full name is required.";
    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) errs.phone = "Valid 10-digit phone number is required.";
    if (!customer.pickup_address.trim()) errs.pickup_address = "Pickup address / location is required.";
    const modelId = selectedCar?.vehicle?.vehicle_model_id || selectedCar?.quote?.vehicle?.vehicle_model_id;
    if (!selectedCar || !isValidUuid(modelId)) {
      errs.vehicle = "Please select an available vehicle model to proceed.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 9. Execute Booking and Razorpay Flow
  const handleProceedToBooking = async (overrideQuote?: QuoteResponse) => {
    setBookingError(null);
    if (!selectedCar || !activeProduct) {
      setBookingError("Please select a valid journey and commercial vehicle.");
      return;
    }
    if (!validateForm()) return;

    const vehicleModelId = selectedCar.vehicle?.vehicle_model_id || selectedCar.quote?.vehicle?.vehicle_model_id;
    if (!isValidUuid(vehicleModelId)) {
      setBookingError("The selected vehicle model has an invalid identifier. Please choose another vehicle.");
      return;
    }
    if (!isValidUuid(activeProduct.id)) {
      setBookingError("The selected journey is unavailable for instant online reservation. Please choose a published route.");
      return;
    }

    const quoteToUse = overrideQuote || selectedCar.quote;
    setBookingSubmitting(true);

    const pickup_at = toIstISOString(pickupDate, pickupTime);
    const return_at =
      category === "outstation" && tripType === "round_trip"
        ? toIstISOString(returnDate, returnTime)
        : undefined;

    const bookingPayload: any = {
      quote: {
        category,
        passenger_count: passengerCount,
        pickup_at,
        vehicle_model_id: selectedCar.vehicle.vehicle_model_id,
        ...(category === "outstation"
          ? { route_id: activeProduct.id, trip_type: tripType, ...(return_at ? { return_at } : {}) }
          : {}),
        ...(category === "local_package" ? { local_package_id: activeProduct.id } : {}),
        ...(category === "transfer" ? { transfer_id: activeProduct.id } : {}),
        ...(category === "tour_package" ? { tour_package_id: activeProduct.id } : {}),
      },
      quoted_total: quoteToUse.total,
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      customer_email: customer.email.trim() || undefined,
      pickup_address: customer.pickup_address.trim(),
      drop_address: customer.drop_address.trim() || undefined,
      flight_train_number: customer.flight_train_number.trim() || undefined,
      special_notes: customer.notes.trim() || undefined,
    };

    try {
      const bookingRes = await createBooking(bookingPayload, accessToken);

      // Protect guest token in sessionStorage; never expose in URL search params
      if (bookingRes.guest_access_token) {
        sessionStorage.setItem(
          `arenaai:guest_token:${bookingRes.booking_id}`,
          bookingRes.guest_access_token
        );
      }
      sessionStorage.setItem("arenaai:last_booking_id", bookingRes.booking_id);

      setBookingSuccess({
        booking_id: bookingRes.booking_id,
        ticket_id: bookingRes.ticket_id,
        advance_amount: bookingRes.advance_amount,
        total_amount: bookingRes.total_amount,
      });

      // Launch Razorpay
      try {
        const paymentRes = await createBookingPayment(bookingRes.booking_id, bookingRes.guest_access_token);
        const scriptReady = await loadRazorpayScript();
        if (scriptReady && window.Razorpay) {
          const rzp = new window.Razorpay({
            key: paymentRes.key_id,
            order_id: paymentRes.order_id,
            amount: paymentRes.amount_paise,
            currency: "INR",
            name: "Agra SK Baghel Tour & Travels",
            description: `Advance Deposit for ${bookingRes.ticket_id}`,
            prefill: {
              name: customer.name,
              contact: customer.phone,
              email: customer.email || undefined,
            },
            theme: { color: "#9F3C16" },
            modal: {
              ondismiss: () => {
                window.location.href = `/booking/confirmation?id=${bookingRes.booking_id}`;
              },
            },
            handler: async (response: any) => {
              if (response?.razorpay_payment_id && response?.razorpay_order_id && response?.razorpay_signature) {
                try {
                  await verifyBookingPayment(
                    bookingRes.booking_id,
                    {
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_signature: response.razorpay_signature,
                    },
                    bookingRes.guest_access_token
                  );
                } catch (verifyErr) {
                  console.warn("Payment verification notification deferred to webhook:", verifyErr);
                }
              }
              window.location.href = `/booking/confirmation?id=${bookingRes.booking_id}`;
            },
          });
          rzp.open();
        } else {
          window.location.href = `/booking/confirmation?id=${bookingRes.booking_id}`;
        }
      } catch (payErr: any) {
        console.warn("Payment initiation deferred:", payErr);
        window.location.href = `/booking/confirmation?id=${bookingRes.booking_id}`;
      }
    } catch (err: any) {
      if (err instanceof CleanFareApiError && err.code === "PRICE_CHANGED") {
        // Handle 409 PRICE_CHANGED reconfirmation gate
        const freshQuote = err.details?.fresh_quote;
        if (freshQuote) {
          setReconfirmation({
            isOpen: true,
            freshQuote,
            oldTotal: quoteToUse.total,
          });
        } else {
          setBookingError("The fare has changed. Please refresh and review current prices.");
        }
      } else {
        const errorMsg =
          err instanceof CleanFareApiError
            ? err.message
            : typeof err?.message === "string" && !err.message.startsWith("[")
              ? err.message
              : "Unable to create booking reservation. Please check your details and try again.";
        setBookingError(errorMsg);
      }
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (catalogLoading && (!catalog || catalog.products.length === 0)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-ink-soft">
            Synchronizing live service catalog…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink pb-20">
      {/* Header Banner */}
      <div className="border-b border-hairline bg-surface-2/60 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-wider text-gold-text">
            Server-Authoritative Reservation
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Book Your Journey
          </h1>
          <p className="mt-2 text-xs text-ink-soft max-w-xl leading-relaxed">
            Instant transparent booking across outstation highways, local tours, and luxury transfers. 28% advance to confirm, remainder on arrival.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Booking Form Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Form & Vehicle Selection */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Category & Product Selection */}
            <div className="rounded-xl border border-hairline bg-surface p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-soft font-mono text-xs text-gold-text">
                  1
                </span>
                Select Service Category & Route
              </h2>

              {/* Category Tabs */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => {
                      setCategory(cat.code);
                      setUnmatchedRouteError(null);
                      const inCat = catalog?.products.filter((p) => p.category === cat.code) || [];
                      if (inCat.length > 0) {
                        setSelectedProductCode(inCat[0].code);
                      } else {
                        setSelectedProductCode("");
                      }
                    }}
                    className={cn(
                      "rounded-md border p-3 text-left transition-colors",
                      category === cat.code
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-hairline bg-surface-2/40 text-ink-soft hover:bg-surface-2"
                    )}
                  >
                    <p className="text-xs leading-snug">{cat.label}</p>
                  </button>
                ))}
              </div>

              {/* Product Selector */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  Specific Route / Package
                </label>
                <select
                  className="w-full rounded-md border border-hairline bg-surface p-2.5 text-sm text-ink focus:outline-primary"
                  value={selectedProductCode}
                  onChange={(e) => {
                    setSelectedProductCode(e.target.value);
                    setUnmatchedRouteError(null);
                  }}
                >
                  {(!selectedProductCode || unmatchedRouteError) && (
                    <option value="">-- Choose a published route or package --</option>
                  )}
                  {productsInCategory.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.name} {p.starting_price_inr ? `(from ₹${p.starting_price_inr.toLocaleString("en-IN")})` : ""}
                    </option>
                  ))}
                </select>
                {unmatchedRouteError && (
                  <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-md text-xs text-ink space-y-2">
                    <p className="font-semibold text-primary">
                      Unpublished corridor requested: &ldquo;{unmatchedRouteError}&rdquo;
                    </p>
                    <p className="text-ink-soft">
                      We do not have a fixed instant online rate for this specific corridor. You can request a custom charter quote or select a published route from the list.
                    </p>
                    <a
                      href={`/contact.html?serviceType=custom_route&from=${encodeURIComponent(normalizedParams.from || "")}&to=${encodeURIComponent(normalizedParams.to || "")}&trip=${tripType}&date=${encodeURIComponent(pickupDate)}`}
                      className="inline-block px-3 py-1 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Enquire Custom Route Quote
                    </a>
                  </div>
                )}
              </div>

              {/* Outstation Trip Type Toggle */}
              {category === "outstation" && (
                <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-4">
                  <span className="text-xs font-semibold text-ink">Trip Type:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTripType("one_way")}
                      className={cn(
                        "rounded-pill px-4 py-1.5 text-xs font-medium transition-colors",
                        tripType === "one_way"
                          ? "bg-primary text-white"
                          : "bg-surface-2 text-ink-soft hover:bg-hairline"
                      )}
                    >
                      One-Way Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType("round_trip")}
                      className={cn(
                        "rounded-pill px-4 py-1.5 text-xs font-medium transition-colors",
                        tripType === "round_trip"
                          ? "bg-primary text-white"
                          : "bg-surface-2 text-ink-soft hover:bg-hairline"
                      )}
                    >
                      Round-Trip
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Schedule & Pickup Details */}
            <div className="rounded-xl border border-hairline bg-surface p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-soft font-mono text-xs text-gold-text">
                  2
                </span>
                Schedule & Passengers
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Pickup Date (IST)</label>
                  <input
                    type="date"
                    value={pickupDate}
                    min={getTodayIstDate()}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setPickupDate(nextDate);
                      if (category === "outstation" && tripType === "round_trip" && returnDate < nextDate) {
                        setReturnDate(nextDate);
                      }
                    }}
                    className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Pickup Time</label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                  />
                </div>

                {category === "outstation" && tripType === "round_trip" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink">Return Date (IST)</label>
                      <input
                        type="date"
                        value={returnDate}
                        min={pickupDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink">Return Time</label>
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Passengers</label>
                  <select
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(Number(e.target.value))}
                    className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                  >
                    {Array.from({ length: 17 }, (_, index) => index + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Passenger" : "Passengers"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Vehicle Selector Options */}
            <div className="rounded-xl border border-hairline bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-soft font-mono text-xs text-gold-text">
                    3
                  </span>
                  Choose Available Vehicle
                </h2>
                {optionsLoading && (
                  <span className="flex items-center gap-1.5 font-mono text-xs text-gold-text">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Computing live fares…
                  </span>
                )}
              </div>

              {optionsError && (
                <div className="rounded-md border border-error/20 bg-error-soft p-4 text-xs text-error mb-4">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Fare Validation Notice</span>
                  </div>
                  <p className="mt-1">{optionsError}</p>
                </div>
              )}

              {options && options.groups.length > 0 ? (
                <div className="space-y-6">
                  {options.groups.map((group) => (
                    <div key={group.group_code} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-hairline pb-1.5">
                        <span className="font-display text-sm font-semibold text-ink">
                          {group.name}
                        </span>
                        <span className="text-[11px] text-ink-faint">
                          ({group.vehicles.length} {group.vehicles.length === 1 ? "model" : "models"} available)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {group.vehicles.map((v) => {
                          const isSelected = selectedCar?.vehicle.vehicle_model_id === v.vehicle_model_id;
                          return (
                            <button
                              key={v.vehicle_model_id}
                              type="button"
                              onClick={() => setSelectedCar({ vehicle: v, quote: v.quote })}
                              className={cn(
                                "group flex flex-col justify-between rounded-lg border p-4 text-left transition-all",
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                                  : "border-hairline bg-surface hover:border-gold-border hover:bg-gold-wash/30"
                              )}
                            >
                              <div>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-semibold text-sm text-ink group-hover:text-gold-text">
                                      {v.display_name}
                                    </p>
                                  </div>
                                  <span
                                    className={cn(
                                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                                      isSelected
                                        ? "border-primary bg-primary text-white"
                                        : "border-hairline bg-surface"
                                    )}
                                  >
                                    {isSelected && <Check className="h-2.5 w-2.5" />}
                                  </span>
                                </div>

                                <div className="mt-3 flex items-center gap-3 text-xs text-ink-soft">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" /> {v.passenger_capacity} seats
                                  </span>
                                  {v.luggage_capacity !== null && (
                                    <span>• {v.luggage_capacity} bags</span>
                                  )}
                                </div>

                                {/* Inclusions Chips */}
                                {v.inclusions && v.inclusions.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {v.inclusions.slice(0, 2).map((inc: string, i: number) => (
                                      <span
                                        key={i}
                                        className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-soft"
                                      >
                                        ✓ {inc}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-3 border-t border-hairline flex items-baseline justify-between">
                                <div>
                                  <p className="font-display text-lg font-bold text-gold-text">
                                    {formatINR(v.quote.total)}
                                  </p>
                                  <p className="font-mono text-[10px] text-ink-faint">
                                    Advance: {formatINR(v.quote.advance)} (28%)
                                  </p>
                                </div>
                                <span className="text-[11px] font-semibold text-primary">
                                  {isSelected ? "Selected" : "Select"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !optionsLoading && (
                  <div className="py-8 text-center text-xs text-ink-soft">
                    No vehicles available for this configuration. Please adjust passenger count or date.
                  </div>
                )
              )}
            </div>

            {/* Step 4: Customer Details Form */}
            <div className="rounded-xl border border-hairline bg-surface p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-soft font-mono text-xs text-gold-text">
                  4
                </span>
                Passenger & Contact Information
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="input-customer-name" className="mb-1 block text-xs font-semibold text-ink">
                    Primary Passenger Name *
                  </label>
                  <input
                    id="input-customer-name"
                    name="customerName"
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-[11px] text-error">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="input-customer-phone" className="mb-1 block text-xs font-semibold text-ink">
                    Mobile Number (WhatsApp) *
                  </label>
                  <input
                    id="input-customer-phone"
                    name="customerPhone"
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={customer.phone}
                    onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                    className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-[11px] text-error">{formErrors.phone}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="input-customer-email" className="mb-1 block text-xs font-semibold text-ink">
                    Email Address (Optional)
                  </label>
                  <input
                    id="input-customer-email"
                    name="customerEmail"
                    type="email"
                    placeholder="For booking confirmation & digital receipt"
                    value={customer.email}
                    onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                    className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                  />
                </div>

                <div className="sm:col-span-2 relative" ref={pickupWrapperRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="input-pickup-address" className="block text-xs font-semibold text-ink">
                      Pickup Address / Hotel / Landmark *
                    </label>
                    {pickupLocationIQ.isLoading && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-ink-faint">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Searching…
                      </span>
                    )}
                  </div>
                  <input
                    id="input-pickup-address"
                    name="pickupAddress"
                    type="text"
                    required
                    placeholder="e.g. Hotel ITC Mughal or Taj East Gate Road"
                    value={customer.pickup_address}
                    onFocus={() => {
                      if (pickupLocationIQ.results.length > 0) setShowPickupSuggestions(true);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomer((c) => ({ ...c, pickup_address: val }));
                      pickupLocationIQ.setQuery(val);
                      setShowPickupSuggestions(true);
                    }}
                    className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                  />
                  {formErrors.pickup_address && (
                    <p className="mt-1 text-[11px] text-error">{formErrors.pickup_address}</p>
                  )}
                  {showPickupSuggestions && pickupLocationIQ.results.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-60 overflow-y-auto rounded-lg border border-hairline bg-surface p-1 shadow-lg">
                      {pickupLocationIQ.results.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const full = item.subtitle ? `${item.name}, ${item.subtitle}` : item.name;
                            setCustomer((c) => ({ ...c, pickup_address: full }));
                            pickupLocationIQ.clearResults();
                            setShowPickupSuggestions(false);
                          }}
                          className="flex w-full items-start gap-2 rounded p-2 text-left hover:bg-surface-2 transition-colors cursor-pointer"
                        >
                          <MapPin className="h-4 w-4 shrink-0 text-gold-text mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-ink">{item.name}</p>
                            {item.subtitle && <p className="text-[11px] text-ink-soft">{item.subtitle}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 relative" ref={dropWrapperRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="input-drop-address" className="block text-xs font-semibold text-ink">
                      Drop-off Address (Optional)
                    </label>
                    {dropLocationIQ.isLoading && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-ink-faint">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Searching…
                      </span>
                    )}
                  </div>
                  <input
                    id="input-drop-address"
                    name="dropAddress"
                    type="text"
                    placeholder="e.g. Terminal 3, IGI Airport Delhi"
                    value={customer.drop_address}
                    onFocus={() => {
                      if (dropLocationIQ.results.length > 0) setShowDropSuggestions(true);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomer((c) => ({ ...c, drop_address: val }));
                      dropLocationIQ.setQuery(val);
                      setShowDropSuggestions(true);
                    }}
                    className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                  />
                  {showDropSuggestions && dropLocationIQ.results.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-60 overflow-y-auto rounded-lg border border-hairline bg-surface p-1 shadow-lg">
                      {dropLocationIQ.results.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const full = item.subtitle ? `${item.name}, ${item.subtitle}` : item.name;
                            setCustomer((c) => ({ ...c, drop_address: full }));
                            dropLocationIQ.clearResults();
                            setShowDropSuggestions(false);
                          }}
                          className="flex w-full items-start gap-2 rounded p-2 text-left hover:bg-surface-2 transition-colors cursor-pointer"
                        >
                          <MapPin className="h-4 w-4 shrink-0 text-gold-text mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-ink">{item.name}</p>
                            {item.subtitle && <p className="text-[11px] text-ink-soft">{item.subtitle}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-ink">
                    Flight / Train Number or Special Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI-804 arriving at 14:30 or extra luggage"
                    value={customer.flight_train_number}
                    onChange={(e) => setCustomer((c) => ({ ...c, flight_train_number: e.target.value }))}
                    className="w-full rounded-md border border-hairline bg-surface p-2 text-sm text-ink focus:outline-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Server-Authoritative Fare Panel */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <div className="rounded-xl border border-hairline bg-surface p-6 shadow-sm">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                Authoritative Breakdown
              </p>
              <h3 className="font-display text-xl font-bold text-ink mt-0.5">
                {selectedCar?.vehicle.display_name || "Select Vehicle"}
              </h3>

              {selectedCar ? (
                <div className="mt-4 space-y-4">
                  {/* Line Items */}
                  <div className="space-y-2 border-b border-hairline pb-4 text-xs">
                    {selectedCar.quote.lines.map((line, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-ink-soft">{line.label}</span>
                        <span className="font-mono font-semibold text-ink">
                          {formatINR(line.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-ink">Total Fare:</span>
                      <span className="font-display text-2xl font-extrabold text-gold-text">
                        {formatINR(selectedCar.quote.total)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-primary font-semibold">
                      <span>Advance Required Today (28%):</span>
                      <span className="font-mono text-sm">
                        {formatINR(selectedCar.quote.advance)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-ink-soft">
                      <span>Balance Payable at Drop-off (72%):</span>
                      <span className="font-mono">
                        {formatINR(selectedCar.quote.balance)}
                      </span>
                    </div>
                  </div>

                  {/* Policies / Messages */}
                  {selectedCar.quote.messages.length > 0 && (
                    <div className="rounded border border-hairline bg-surface-2/60 p-2.5 text-[11px] text-ink-soft space-y-1">
                      {selectedCar.quote.messages.map((msg, i) => (
                        <p key={i}>• {msg}</p>
                      ))}
                    </div>
                  )}

                  {bookingError && (
                    <div className="mb-3 rounded border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
                      {bookingError}
                    </div>
                  )}
                  {formErrors.vehicle && (
                    <div className="mb-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                      {formErrors.vehicle}
                    </div>
                  )}

                  {/* Submission CTA */}
                  <button
                    id="btn-proceed-booking"
                    type="button"
                    disabled={bookingSubmitting}
                    onClick={() => handleProceedToBooking()}
                    className="w-full rounded-sm bg-primary py-3 text-center text-xs font-semibold uppercase tracking-wider text-white shadow transition-all hover:bg-gold-text disabled:opacity-50"
                  >
                    {bookingSubmitting ? "Securing Booking…" : `Pay Advance ${formatINR(selectedCar.quote.advance)} & Reserve`}
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-ink-soft">
                  Select a vehicle model to view authoritative quote breakdown.
                </div>
              )}

              <div className="mt-4 border-t border-hairline pt-3 text-[11px] text-ink-faint">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span>100% Guaranteed transparent fare. Zero hidden fees.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 409 PRICE_CHANGED Reconfirmation Dialog */}
      <AnimatePresence>
        {reconfirmation.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl border border-hairline bg-surface p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-6 w-6 shrink-0" />
                <h3 className="font-display text-lg font-bold text-ink">Fare Updated</h3>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                The rates for this journey were recently updated by operations desk while you were configuring your booking. Please review the updated total before proceeding.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-hairline bg-surface-2 p-3 text-center">
                <div>
                  <p className="font-mono text-[10px] text-ink-faint uppercase">Previous Quote</p>
                  <p className="font-display text-lg font-bold line-through text-ink-soft">
                    {formatINR(reconfirmation.oldTotal)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-gold-text uppercase">Updated Total</p>
                  <p className="font-display text-lg font-bold text-gold-text">
                    {formatINR(reconfirmation.freshQuote.total)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReconfirmation({ ...reconfirmation, isOpen: false })}
                  className="rounded-sm border border-hairline px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fresh = reconfirmation.freshQuote;
                    setReconfirmation({ ...reconfirmation, isOpen: false });
                    if (selectedCar) {
                      setSelectedCar({ vehicle: selectedCar.vehicle, quote: fresh });
                    }
                    handleProceedToBooking(fresh);
                  }}
                  className="rounded-sm bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-gold-text"
                >
                  Accept Updated Fare & Reserve
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CleanBookingPage;
