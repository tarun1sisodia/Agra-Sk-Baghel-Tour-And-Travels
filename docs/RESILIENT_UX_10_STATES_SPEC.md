# Resilient UX: 10 Canonical States Specification
**Document Version:** 1.0.0  
**Last Updated:** 2026-11-01  
**Project:** Agra SK Baghel Tour & Travels  
**Category:** User Experience, Error Handling, System Resilience

---

## 1. Executive Summary

This specification defines the **10 canonical resilient UX states** that every Agra SK Baghel Tour & Travels application must implement. These states cover the full spectrum of user experiences—from empty states to success—ensuring that users always receive clear, actionable feedback regardless of system conditions.

### 1.1 Why 10 States?

Traditional applications only handle three states: **loading**, **success**, and **error**. This is insufficient for a travel booking platform where:

- Users may be offline while attempting to book
- Payment gateways may decline transactions
- Network conditions may be slow (especially in rural India)
- Sessions may expire mid-booking
- Form validation may require inline fixes

The 10-state model ensures **resilience by design**, not by accident.

### 1.2 State Categories

| Category | States | Purpose |
|----------|--------|---------|
| **Initial State** | Empty | No data, no errors, no loading |
| **Loading States** | Loading, Slow Network | Data is being fetched or processed |
| **Error States** | Error, Offline, No Search Results, Permission Denied, Session Expired, Validation Failure | Something went wrong |
| **Success State** | Success | Operation completed successfully |

---

## 2. State 1: Empty State

**Purpose:** Communicate that no data is available, and provide a clear path to generate or retrieve data.

### 2.1 When to Show

- No search results found (after initial load)
- No bookings in history
- No reviews yet
- No fleet vehicles available for selected criteria

### 2.2 Component Specification

```tsx
interface EmptyStateProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
}
```

### 2.3 Copywriting Guidelines

| Scenario | Title | Subtitle | Action |
|----------|-------|----------|--------|
| No bookings | "No Bookings Yet" | "Your journey begins here. Book your first trip today." | "Book a Trip" |
| No reviews | "No Reviews Yet" | "Be the first to share your experience." | "Write a Review" |
| No fleet | "No Vehicles Available" | "Please try different dates or locations." | "Change Search" |

### 2.4 Technical Logic

```typescript
const isEmptyState = useMemo(() => {
  return (
    !isLoading &&
    !hasError &&
    data.length === 0 &&
    searchQuery === "" // Only show empty state for initial load
  );
}, [isLoading, hasError, data.length, searchQuery]);
```

---

## 3. State 2: Loading State

**Purpose:** Communicate that data is being fetched or processed, with three tiers of loading indicators.

### 3.1 Loading State Types

| Type | Use Case | Example |
|------|----------|---------|
| **Skeleton** | Content placeholders | Shimmering card, text lines |
| **Spinner** | Indeterminate loading | Circular/linear progress |
| **Progress** | Determinate loading | 0–100% progress bar |

### 3.2 Component Specification

```tsx
interface LoadingStateProps {
  type: "skeleton" | "spinner" | "progress";
  message?: string;
  progress?: number; // 0–100 for progress type
}
```

### 3.3 Copywriting Guidelines

| Scenario | Message | Progress |
|----------|---------|----------|
| Initial page load | "Loading your options..." | N/A (spinner) |
| Fare calculation | "Calculating fare..." | N/A (spinner) |
| Payment processing | "Processing payment..." | 0–100% (progress) |
| Image upload | "Uploading images..." | 0–100% (progress) |

### 3.4 Technical Logic

```typescript
const loadingState = useMemo<LoadingStateConfig>(() => {
  if (isFareCalculating) {
    return { type: "spinner", message: "Calculating fare..." };
  }
  if (isPaymentProcessing) {
    return { type: "progress", message: "Processing payment...", progress: paymentProgress };
  }
  if (isInitialLoad) {
    return { type: "skeleton" };
  }
  return { type: "spinner", message: "Loading..." };
}, [isFareCalculating, isPaymentProcessing, isInitialLoad, paymentProgress]);
```

---

## 4. State 3: Error State

**Purpose:** Communicate what went wrong, whose fault it is, and how to fix it.

### 4.1 Error Fault Classification

| Fault Owner | Description | Examples | Recovery Action |
|-------------|-------------|----------|-----------------|
| **user_input** | Validation / missing field | Invalid email, missing phone | Fix inline fields |
| **bank_gateway** | Bank declined / UPI timeout | Card declined, insufficient funds | Try alternate payment |
| **network** | Offline / DNS / timeout | No internet, DNS failure | Reload page |
| **auth_session** | Expired JWT / guest token | Session expired, token invalid | Re-authenticate |
| **server** | Internal API / DB issue | 5xx errors, database error | Contact WhatsApp desk |

### 4.2 Component Specification

```tsx
interface ErrorStateProps {
  code: string;
  title: string;
  faultOwner: ErrorFaultOwner;
  explanation: string;
  howToFix: string;
  primaryAction: RecoveryActionType;
  primaryActionLabel: string;
  fieldFixes?: FieldValidationFix[];
  requestId?: string;
}
```

### 4.3 Copywriting Guidelines

| Fault Owner | Title | Explanation | How to Fix | Primary Action |
|-------------|-------|-------------|------------|----------------|
| user_input | "Please Fix Field Errors" | "Some fields need correction before we can proceed." | "Please correct the fields marked below." | "Fix Field Errors" |
| bank_gateway | "Payment Declined by Bank" | "Your bank or UPI app declined the transaction. No money was deducted." | "Try another UPI ID, use a different card, or retry below." | "Try Another Payment Method" |
| network | "No Internet Connection" | "You appear to be offline. Please check your connection and try again." | "Check your Wi-Fi or mobile data and reload the page." | "Reload Page" |
| auth_session | "Session Expired" | "Your session has expired. Please sign in again to continue." | "Sign in again to resume your booking." | "Sign In to Keep Draft" |
| server | "Something Went Wrong" | "We encountered an unexpected error. Please try again later." | "Reload the page or contact our support team." | "Contact WhatsApp Desk" |

### 4.4 Technical Logic

```typescript
const errorState = useMemo<ActionableErrorEnvelope>(() => {
  if (httpStatus >= 400 && httpStatus < 500) {
    if (errorCode === "VALIDATION_ERROR") {
      return {
        code: errorCode,
        title: "Please Fix Field Errors",
        faultOwner: "user_input",
        explanation: "Some fields need correction before we can proceed.",
        howToFix: "Please correct the fields marked below.",
        primaryAction: "fix_inline_fields",
        primaryActionLabel: "Fix Field Errors",
        fieldFixes: resolveFieldFixes(errorCode, errorDetails),
      };
    }
    if (errorCode === "SESSION_EXPIRED") {
      return {
        code: errorCode,
        title: "Session Expired",
        faultOwner: "auth_session",
        explanation: "Your session has expired. Please sign in again to continue.",
        howToFix: "Sign in again to resume your booking.",
        primaryAction: "reauthenticate_keep_draft",
        primaryActionLabel: "Sign In to Keep Draft",
      };
    }
  }

  if (errorCode.includes("PAYMENT") || errorCode.includes("RAZORPAY")) {
    return {
      code: errorCode,
      title: "Payment Declined by Bank",
      faultOwner: "bank_gateway",
      explanation: "Your bank or UPI app declined the transaction. No money was deducted.",
      howToFix: "Try another UPI ID, use a different card, or retry below.",
      primaryAction: "try_alternate_payment",
      primaryActionLabel: "Try Another Payment Method",
    };
  }

  if (errorCode === "NETWORK_ERROR" || errorCode === "TIMEOUT") {
    return {
      code: errorCode,
      title: "No Internet Connection",
      faultOwner: "network",
      explanation: "You appear to be offline. Please check your connection and try again.",
      howToFix: "Check your Wi-Fi or mobile data and reload the page.",
      primaryAction: "reload_page",
      primaryActionLabel: "Reload Page",
    };
  }

  return {
    code: errorCode,
    title: "Something Went Wrong",
    faultOwner: "server",
    explanation: "We encountered an unexpected error. Please try again later.",
    howToFix: "Reload the page or contact our support team.",
    primaryAction: "contact_whatsapp_desk",
    primaryActionLabel: "Contact WhatsApp Desk",
    requestId: errorDetails?.requestId as string,
  };
}, [httpStatus, errorCode, errorDetails]);
```

---

## 5. State 4: Offline State

**Purpose:** Communicate that the user is offline and provide options to retry or queue for later sync.

### 5.1 When to Show

- User attempts to book while offline
- User attempts to submit a form while offline
- User attempts to upload media while offline

### 5.2 Component Specification

```tsx
interface OfflineStateProps {
  title: string;
  subtitle: string;
  retryLabel: string;
  retryAction: "retry_now" | "retry_later" | "queue_for_sync";
}
```

### 5.3 Copywriting Guidelines

| Scenario | Title | Subtitle | Retry Label | Retry Action |
|----------|-------|----------|-------------|--------------|
| Book attempt offline | "You're Offline" | "Please connect to the internet to complete your booking." | "Retry Now" | retry_now |
| Form submission offline | "Connection Lost" | "Your data is saved locally. Connect to submit." | "Connect & Submit" | queue_for_sync |
| Media upload offline | "Upload Paused" | "Media will be uploaded once you're back online." | "Retry Upload" | retry_later |

### 5.4 Technical Logic

```typescript
const isOnline = useOnlineStatus();

const offlineState = useMemo<OfflineStateConfig>(() => {
  if (!isOnline) {
    return {
      title: "You're Offline",
      subtitle: "Please connect to the internet to complete your booking.",
      retryLabel: "Retry Now",
      retryAction: "retry_now",
    };
  }
  return null;
}, [isOnline]);
```

---

## 6. State 5: Slow Network State

**Purpose:** Communicate that the network is slow and provide patience messages or fallback options.

### 6.1 When to Show

- API response time > 3 seconds
- Image loading is slow
- Fare calculation is taking time

### 6.2 Component Specification

```tsx
interface SlowNetworkStateProps {
  title: string;
  subtitle: string;
  patienceMessage: string;
  fallbackLabel?: string;
  fallbackAction?: string;
}
```

### 6.3 Copywriting Guidelines

| Scenario | Title | Subtitle | Patience Message | Fallback |
|----------|-------|----------|------------------|----------|
| Slow API response | "Taking a Moment" | "We're fetching the best options for you." | "This may take a few seconds..." | "Show Basic Options" |
| Slow image loading | "Loading Images" | "High-quality photos are loading." | "Please wait while we load the photos..." | "Show Text-Only View" |
| Slow fare calculation | "Calculating Fare" | "We're finding the best price for your trip." | "This may take a few seconds..." | "Show Estimated Fare" |

### 6.4 Technical Logic

```typescript
const responseTime = useResponseTime();
const isSlowNetwork = responseTime > 3000; // 3 seconds

const slowNetworkState = useMemo<SlowNetworkStateConfig>(() => {
  if (isSlowNetwork) {
    return {
      title: "Taking a Moment",
      subtitle: "We're fetching the best options for you.",
      patienceMessage: "This may take a few seconds...",
      fallbackLabel: "Show Basic Options",
      fallbackAction: "show_basic_options",
    };
  }
  return null;
}, [isSlowNetwork]);
```

---

## 7. State 6: No Search Results State

**Purpose:** Communicate that no results were found for the search query and provide suggestions.

### 7.1 When to Show

- No routes match the search criteria
- No tour packages match the search criteria
- No monuments match the search criteria

### 7.2 Component Specification

```tsx
interface NoSearchResultsStateProps {
  title: string;
  subtitle: string;
  suggestions?: string[];
  resetLabel?: string;
}
```

### 7.3 Copywriting Guidelines

| Scenario | Title | Subtitle | Suggestions | Reset Label |
|----------|-------|----------|-------------|-------------|
| No routes | "No Routes Found" | "Try different locations or dates." | ["Delhi to Agra", "Agra to Delhi", "Delhi to Jaipur"] | "Clear Search" |
| No packages | "No Packages Found" | "Try different tour types or durations." | ["3-Day Golden Triangle", "2-Day Taj Mahal Tour", "1-Day Agra Tour"] | "Clear Search" |
| No monuments | "No Monuments Found" | "Try different cities or keywords." | ["Taj Mahal", "Agra Fort", "Fatehpur Sikri"] | "Clear Search" |

### 7.4 Technical Logic

```typescript
const noSearchResults = useMemo<NoSearchResultsStateConfig>(() => {
  if (searchResults.length === 0 && searchQuery !== "") {
    return {
      title: "No Routes Found",
      subtitle: "Try different locations or dates.",
      suggestions: [
        "Delhi to Agra",
        "Agra to Delhi",
        "Delhi to Jaipur",
      ],
      resetLabel: "Clear Search",
    };
  }
  return null;
}, [searchResults.length, searchQuery]);
```

---

## 8. State 7: Permission Denied State

**Purpose:** Communicate that a permission is required and provide a way to grant it.

### 8.1 When to Show

- Location permission denied
- Camera permission denied
- Notification permission denied

### 8.2 Component Specification

```tsx
interface PermissionDeniedStateProps {
  title: string;
  subtitle: string;
  permissionType: "auth" | "location" | "notifications" | "camera" | "microphone";
  actionLabel: string;
  actionIcon?: string;
}
```

### 8.3 Copywriting Guidelines

| Permission Type | Title | Subtitle | Action Label |
|-----------------|-------|----------|--------------|
| auth | "Sign In Required" | "Please sign in to continue." | "Sign In" |
| location | "Location Access Required" | "We need your location to calculate fares." | "Enable Location" |
| notifications | "Notifications Required" | "We'll send booking updates and alerts." | "Enable Notifications" |
| camera | "Camera Access Required" | "Please allow camera access to upload documents." | "Enable Camera" |
| microphone | "Microphone Access Required" | "Please allow microphone access for voice notes." | "Enable Microphone" |

### 8.4 Technical Logic

```typescript
const permissionState = useMemo<PermissionDeniedStateConfig>(() => {
  if (!hasLocationPermission) {
    return {
      title: "Location Access Required",
      subtitle: "We need your location to calculate fares.",
      permissionType: "location",
      actionLabel: "Enable Location",
    };
  }
  return null;
}, [hasLocationPermission]);
```

---

## 9. State 8: Session Expired State

**Purpose:** Communicate that the session has expired and provide a way to re-authenticate.

### 9.1 When to Show

- JWT token expired
- Guest token expired
- User inactive for too long

### 9.2 Component Specification

```tsx
interface SessionExpiredStateProps {
  title: string;
  subtitle: string;
  actionLabel: string;
  keepDraft?: boolean;
}
```

### 9.3 Copywriting Guidelines

| Scenario | Title | Subtitle | Action Label | Keep Draft |
|----------|-------|----------|--------------|------------|
| JWT expired | "Session Expired" | "Please sign in again to continue." | "Sign In" | true |
| Guest token expired | "Your Draft Has Expired" | "Please sign in to save your booking." | "Sign In" | true |
| User inactive | "You've Been Signed Out" | "Please sign in again to continue." | "Sign In" | false |

### 9.4 Technical Logic

```typescript
const sessionExpiredState = useMemo<SessionExpiredStateConfig>(() => {
  if (isJwtExpired) {
    return {
      title: "Session Expired",
      subtitle: "Please sign in again to continue.",
      actionLabel: "Sign In",
      keepDraft: true,
    };
  }
  return null;
}, [isJwtExpired]);
```

---

## 10. State 9: Validation Failure State

**Purpose:** Communicate inline field validation errors with specific fixes.

### 10.1 When to Show

- Email format is invalid
- Phone number is invalid
- Password requirements not met
- Date is in the past

### 10.2 Component Specification

```tsx
interface ValidationFailureStateProps {
  code: string;
  title: string;
  fieldFixes: InlineValidationFix[];
}
```

### 10.3 Copywriting Guidelines

| Field | Issue | Specific Fix | Action Label |
|-------|-------|--------------|--------------|
| email | Invalid email format | "Enter a valid email with a domain (e.g., user@gmail.com)" | "Fix Email" |
| phone | Invalid phone number | "Enter a 10-digit Indian phone number (e.g., 9876543210)" | "Fix Phone" |
| password | Password requirements not met | "Use 8+ characters with uppercase, lowercase, number, and special character" | "Fix Password" |
| pickup_date | Date is in the past | "Please select a future date for pickup" | "Fix Date" |

### 10.4 Technical Logic

```typescript
const validationFailureState = useMemo<ValidationFailureEnvelope>(() => {
  if (hasValidationErrors) {
    return {
      code: "VALIDATION_ERROR",
      title: "Please Fix Field Errors",
      fieldFixes: resolveFieldFixes(errorCode, errorDetails),
    };
  }
  return null;
}, [hasValidationErrors, errorCode, errorDetails]);
```

---

## 11. State 10: Success State

**Purpose:** Communicate that an operation completed successfully and provide next steps.

### 11.1 When to Show

- Booking confirmed
- Payment successful
- Review submitted
- Profile updated

### 11.2 Component Specification

```tsx
interface SuccessStateProps {
  title: string;
  subtitle: string;
  icon?: string;
  ctaLabel?: string;
  ctaAction?: string;
  nextSteps?: string[];
}
```

### 11.3 Copywriting Guidelines

| Scenario | Title | Subtitle | Icon | CTA Label | Next Steps |
|----------|-------|----------|------|-----------|------------|
| Booking confirmed | "Booking Confirmed!" | "Your trip to Agra is all set. Check your email for details." | ✅ | "View Booking" | ["Check your email for booking confirmation", "Add to calendar", "Share with friends"] |
| Payment successful | "Payment Successful" | "Your payment of ₹500 has been processed." | 💰 | "View Receipt" | ["Download receipt", "Share payment confirmation", "Contact support if needed"] |
| Review submitted | "Thank You for Your Review!" | "Your feedback helps us serve you better." | 🌟 | "Write Another Review" | ["Share your review", "View your reviews", "Explore more tours"] |
| Profile updated | "Profile Updated" | "Your profile has been successfully updated." | ✅ | "Continue" | ["Review your profile", "Update preferences", "Explore features"] |

### 11.4 Technical Logic

```typescript
const successState = useMemo<SuccessStateConfig>(() => {
  if (bookingConfirmed) {
    return {
      title: "Booking Confirmed!",
      subtitle: "Your trip to Agra is all set. Check your email for details.",
      icon: "✅",
      ctaLabel: "View Booking",
      nextSteps: [
        "Check your email for booking confirmation",
        "Add to calendar",
        "Share with friends",
      ],
    };
  }
  return null;
}, [bookingConfirmed]);
```

---

## 12. Resilient State Manager API

### 12.1 State Context

```typescript
interface ResilientStateContext {
  type: ResilientStateType;
  state: ResilientState;
  reset: () => void;
  retry: () => Promise<void>;
}
```

### 12.2 State Manager Hook

```typescript
function useResilientState<T>(options: {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isOnline: boolean;
  hasPermission: boolean;
  sessionValid: boolean;
}): ResilientStateContext {
  // Implementation details...
}
```

---

## 13. Implementation Checklist

### 13.1 Frontend

- [ ] Empty state component with action
- [ ] Loading state component (skeleton, spinner, progress)
- [ ] Error state component with fault classification
- [ ] Offline state component with retry options
- [ ] Slow network state component with patience messages
- [ ] No search results component with suggestions
- [ ] Permission denied component with action
- [ ] Session expired component with re-auth
- [ ] Validation failure component with inline fixes
- [ ] Success state component with next steps

### 13.2 Backend

- [ ] Error fault classification endpoint
- [ ] Recovery action resolver endpoint
- [ ] Field fix resolver endpoint

### 13.3 Testing

- [ ] Unit tests for each state
- [ ] Integration tests for state transitions
- [ ] E2E tests for error recovery flows

---

## 14. References

- [Zod Schema Documentation](https://zod.dev/)
- [React Hooks Documentation](https://react.dev/reference/react)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-11-01  
**Project:** Agra SK Baghel Tour & Travels  
**Category:** User Experience, Error Handling, System Resilience
