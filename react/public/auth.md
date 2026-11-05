# auth.md — Agent Registration and Authentication

This document describes how autonomous AI agents, multi-agent systems, and automated clients register, authenticate, and interact with the **Agra SK Baghel Tour & Travels** platform.

## Agent Audience & Scope
Autonomous travel assistants, conversational itinerary planners, and agentic commerce platforms authorized to:
1. Retrieve live verified taxi rates, sightseeing packages, and monument itineraries.
2. Request fare calculations and check vehicle custody availability.
3. Initiate secure booking requests on behalf of human travelers.

---

## OAuth & OIDC Discovery Metadata

- **OAuth Protected Resource Metadata (RFC 9728)**:
  `/.well-known/oauth-protected-resource`
- **OAuth Authorization Server Metadata (RFC 8414)**:
  `/.well-known/oauth-authorization-server`
- **OpenID Connect Discovery**:
  `/.well-known/openid-configuration`
- **Resource Identifier**:
  `https://api.agraskbagheltourandtravels.com`

---

## Supported Authentication Flows

### 1. Anonymous Read-Only Access
Agents may query public fares, sitemaps, route manifests, and monument dossiers without pre-registration.
- `identity_types_supported`: `["anonymous"]`
- `anonymous.credential_types_supported`: `["none"]`
- `claim_uri`: `https://api.agraskbagheltourandtravels.com/api/v1/auth/anonymous`

### 2. Client Credentials (Registered Agent Assistants)
Registered agent operators receive an API client key/secret for elevated rate limits, webhooks, and live reservation custody:
- `identity_types_supported`: `["client_credentials", "identity_assertion"]`
- `identity_assertion.assertion_types_supported`: `["urn:ietf:params:oauth:token-type:id-jag", "verified_email"]`
- `token_endpoint`: `https://api.agraskbagheltourandtravels.com/api/v1/auth/token`
- `bearer_methods_supported`: `["header"]`

### 3. Agent Registration
- `register_uri`: `https://api.agraskbagheltourandtravels.com/api/v1/agents/register`
- `skill`: `https://agraskbagheltourandtravels.com/.well-known/agent-skills/agra-taxi-booking/SKILL.md`

---

## Credential Use & Security
- Send bearer tokens using the standard HTTP Authorization header:
  `Authorization: Bearer <TOKEN>`
- Do not transmit customer payment credentials (credit cards, UPI pins) directly. Payment sessions are facilitated via server-authoritative Razorpay signatures.
- For assistance, contact our technical operations desk at `support@agraskbagheltourandtravels.com`.

