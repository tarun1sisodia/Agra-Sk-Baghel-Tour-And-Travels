export interface AppRoute {
  path: string;
  page: "home" | "booking" | "marketing";
  localized: boolean;
}

export const marketingHubs = [
  "services",
  "routes",
  "packages",
  "monuments",
  "fleet",
  "about",
  "contact",
  "faq",
  "privacy",
  "terms",
  "cookie"
] as const;

export const marketingDetailPrefixes = ["vehicles", "packages"] as const;

export const appRoutes: AppRoute[] = [
  { path: "/", page: "home", localized: false },
  { path: "/book.html", page: "booking", localized: false },
  { path: "/en/*", page: "marketing", localized: false }
];
