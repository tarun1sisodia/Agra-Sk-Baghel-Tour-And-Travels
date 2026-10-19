import type { Template } from "@pdfme/common";

export interface BookingPdfInputData {
  brandTitle?: string;
  brandSubtitle?: string;
  voucherTitle?: string;
  ticketId: string;
  statusBadge: string;
  bookingDateText: string;
  paymentIdText: string;
  securityBadge?: string;

  sec1Title?: string;
  custNameLbl?: string;
  customerName: string;
  custPhoneLbl?: string;
  customerPhone: string;
  custEmailLbl?: string;
  customerEmail: string;
  paxLbl?: string;
  passengerInfo: string;

  sec2Title?: string;
  srvLbl?: string;
  serviceName: string;
  vehLbl?: string;
  vehicleName: string;
  pickTimeLbl?: string;
  pickupTime: string;
  pickAddrLbl?: string;
  pickupAddress: string;
  dropAddrLbl?: string;
  dropAddress: string;

  sec3Title?: string;
  fareTotLbl?: string;
  fareTotalVal: string;
  fareAdvLbl?: string;
  fareAdvVal: string;
  fareBalLbl?: string;
  fareBalVal: string;
  fareNote?: string;

  noticeTitle?: string;
  noticeBody?: string;

  ftHelp?: string;
  ftAddr?: string;
  ftDisc?: string;
}

export const bookingVoucherTemplate: Template = {
  basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
  schemas: [
    [
      // Header Brand Banner
      {
        name: "hdrBg",
        type: "rectangle",
        position: { x: 12, y: 12 },
        width: 186,
        height: 28,
        color: "#8B2E0B",
        borderColor: "#8B2E0B",
        readOnly: true,
      },
      {
        name: "brandTitle",
        type: "text",
        position: { x: 16, y: 15 },
        width: 110,
        height: 8,
        fontSize: 16,
        fontColor: "#FFFFFF",
        readOnly: true,
      },
      {
        name: "brandSubtitle",
        type: "text",
        position: { x: 16, y: 25 },
        width: 110,
        height: 6,
        fontSize: 7.5,
        fontColor: "#FED7AA",
        readOnly: true,
      },
      {
        name: "voucherTitle",
        type: "text",
        position: { x: 126, y: 15 },
        width: 68,
        height: 6,
        fontSize: 8.5,
        fontColor: "#FFFFFF",
        alignment: "right",
        readOnly: true,
      },
      {
        name: "ticketId",
        type: "text",
        position: { x: 126, y: 22 },
        width: 68,
        height: 7,
        fontSize: 11,
        fontColor: "#FFFFFF",
        alignment: "right",
      },
      {
        name: "statusBadge",
        type: "text",
        position: { x: 126, y: 30 },
        width: 68,
        height: 6,
        fontSize: 8,
        fontColor: "#A7F3D0",
        alignment: "right",
      },

      // Metadata Bar
      {
        name: "metaBg",
        type: "rectangle",
        position: { x: 12, y: 43 },
        width: 186,
        height: 11,
        color: "#F8FAFC",
        borderColor: "#E2E8F0",
        readOnly: true,
      },
      {
        name: "bookingDateText",
        type: "text",
        position: { x: 16, y: 45.5 },
        width: 60,
        height: 6,
        fontSize: 8,
        fontColor: "#475569",
      },
      {
        name: "paymentIdText",
        type: "text",
        position: { x: 80, y: 45.5 },
        width: 60,
        height: 6,
        fontSize: 8,
        fontColor: "#475569",
      },
      {
        name: "securityBadge",
        type: "text",
        position: { x: 142, y: 45.5 },
        width: 52,
        height: 6,
        fontSize: 8,
        fontColor: "#065F46",
        alignment: "right",
        readOnly: true,
      },

      // Section 1: Passenger & Contact Details
      {
        name: "sec1Title",
        type: "text",
        position: { x: 12, y: 57 },
        width: 186,
        height: 5,
        fontSize: 9.5,
        fontColor: "#8B2E0B",
        readOnly: true,
      },
      {
        name: "sec1Bg",
        type: "rectangle",
        position: { x: 12, y: 63 },
        width: 186,
        height: 26,
        color: "#FFFFFF",
        borderColor: "#E2E8F0",
        readOnly: true,
      },
      {
        name: "custNameLbl",
        type: "text",
        position: { x: 16, y: 66 },
        width: 55,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "customerName",
        type: "text",
        position: { x: 16, y: 70 },
        width: 55,
        height: 6,
        fontSize: 9.5,
        fontColor: "#0F172A",
      },
      {
        name: "custPhoneLbl",
        type: "text",
        position: { x: 75, y: 66 },
        width: 45,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "customerPhone",
        type: "text",
        position: { x: 75, y: 70 },
        width: 45,
        height: 6,
        fontSize: 9.5,
        fontColor: "#0F172A",
      },
      {
        name: "custEmailLbl",
        type: "text",
        position: { x: 125, y: 66 },
        width: 68,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "customerEmail",
        type: "text",
        position: { x: 125, y: 70 },
        width: 68,
        height: 6,
        fontSize: 9.5,
        fontColor: "#0F172A",
      },
      {
        name: "paxLbl",
        type: "text",
        position: { x: 16, y: 78 },
        width: 80,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "passengerInfo",
        type: "text",
        position: { x: 16, y: 82 },
        width: 80,
        height: 5,
        fontSize: 8.5,
        fontColor: "#0F172A",
      },

      // Section 2: Itinerary & Vehicle Specifications
      {
        name: "sec2Title",
        type: "text",
        position: { x: 12, y: 92 },
        width: 186,
        height: 5,
        fontSize: 9.5,
        fontColor: "#8B2E0B",
        readOnly: true,
      },
      {
        name: "sec2Bg",
        type: "rectangle",
        position: { x: 12, y: 98 },
        width: 186,
        height: 54,
        color: "#FFFFFF",
        borderColor: "#E2E8F0",
        readOnly: true,
      },
      {
        name: "srvLbl",
        type: "text",
        position: { x: 16, y: 101 },
        width: 85,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "serviceName",
        type: "text",
        position: { x: 16, y: 105 },
        width: 85,
        height: 6,
        fontSize: 9.5,
        fontColor: "#0F172A",
      },
      {
        name: "vehLbl",
        type: "text",
        position: { x: 105, y: 101 },
        width: 85,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "vehicleName",
        type: "text",
        position: { x: 105, y: 105 },
        width: 85,
        height: 6,
        fontSize: 9.5,
        fontColor: "#0F172A",
      },
      {
        name: "pickTimeLbl",
        type: "text",
        position: { x: 16, y: 113 },
        width: 85,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "pickupTime",
        type: "text",
        position: { x: 16, y: 117 },
        width: 85,
        height: 6,
        fontSize: 9.5,
        fontColor: "#0F172A",
      },
      {
        name: "pickAddrLbl",
        type: "text",
        position: { x: 16, y: 125 },
        width: 85,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "pickupAddress",
        type: "text",
        position: { x: 16, y: 129 },
        width: 85,
        height: 18,
        fontSize: 8.5,
        fontColor: "#0F172A",
        dynamicFontSize: { min: 7, max: 9, fit: "vertical" },
      },
      {
        name: "dropAddrLbl",
        type: "text",
        position: { x: 105, y: 125 },
        width: 85,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "dropAddress",
        type: "text",
        position: { x: 105, y: 129 },
        width: 85,
        height: 18,
        fontSize: 8.5,
        fontColor: "#0F172A",
        dynamicFontSize: { min: 7, max: 9, fit: "vertical" },
      },

      // Section 3: Tariff Breakdown & Balance Due
      {
        name: "sec3Title",
        type: "text",
        position: { x: 12, y: 156 },
        width: 186,
        height: 5,
        fontSize: 9.5,
        fontColor: "#8B2E0B",
        readOnly: true,
      },
      {
        name: "sec3Bg",
        type: "rectangle",
        position: { x: 12, y: 162 },
        width: 186,
        height: 35,
        color: "#F8FAFC",
        borderColor: "#CBD5E1",
        readOnly: true,
      },
      {
        name: "fareTotLbl",
        type: "text",
        position: { x: 18, y: 166 },
        width: 50,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "fareTotalVal",
        type: "text",
        position: { x: 18, y: 171 },
        width: 50,
        height: 8,
        fontSize: 13,
        fontColor: "#0F172A",
      },
      {
        name: "fareAdvLbl",
        type: "text",
        position: { x: 76, y: 166 },
        width: 50,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "fareAdvVal",
        type: "text",
        position: { x: 76, y: 171 },
        width: 50,
        height: 8,
        fontSize: 13,
        fontColor: "#065F46",
      },
      {
        name: "fareBalLbl",
        type: "text",
        position: { x: 134, y: 166 },
        width: 58,
        height: 4,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },
      {
        name: "fareBalVal",
        type: "text",
        position: { x: 134, y: 171 },
        width: 58,
        height: 8,
        fontSize: 13,
        fontColor: "#92400E",
      },
      {
        name: "fareNote",
        type: "text",
        position: { x: 18, y: 188 },
        width: 174,
        height: 6,
        fontSize: 7,
        fontColor: "#64748B",
        readOnly: true,
      },

      // Section 4: Chauffeur Dispatch Protocol Notice
      {
        name: "noticeBg",
        type: "rectangle",
        position: { x: 12, y: 202 },
        width: 186,
        height: 26,
        color: "#FFFBEB",
        borderColor: "#FEF3C7",
        readOnly: true,
      },
      {
        name: "noticeTitle",
        type: "text",
        position: { x: 16, y: 205 },
        width: 178,
        height: 5,
        fontSize: 8,
        fontColor: "#92400E",
        readOnly: true,
      },
      {
        name: "noticeBody",
        type: "text",
        position: { x: 16, y: 211 },
        width: 178,
        height: 14,
        fontSize: 7.5,
        fontColor: "#78350F",
        readOnly: true,
      },

      // Section 5: Divider & Footer
      {
        name: "divLine",
        type: "line",
        position: { x: 12, y: 236 },
        width: 186,
        height: 0.5,
        color: "#E2E8F0",
        readOnly: true,
      },
      {
        name: "ftHelp",
        type: "text",
        position: { x: 12, y: 240 },
        width: 186,
        height: 5,
        fontSize: 8,
        fontColor: "#0F172A",
        alignment: "center",
        readOnly: true,
      },
      {
        name: "ftAddr",
        type: "text",
        position: { x: 12, y: 246 },
        width: 186,
        height: 5,
        fontSize: 7.5,
        fontColor: "#64748B",
        alignment: "center",
        readOnly: true,
      },
      {
        name: "ftDisc",
        type: "text",
        position: { x: 12, y: 252 },
        width: 186,
        height: 5,
        fontSize: 6.5,
        fontColor: "#94A3B8",
        alignment: "center",
        readOnly: true,
      },
    ],
  ],
};
