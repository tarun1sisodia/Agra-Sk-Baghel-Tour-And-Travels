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
  // A4 landscape. The layout takes inspiration from the supplied cream-and-gold
  // SK Baghel voucher: clean white data area, warm branded side panel and brown/gold accents.
  basePdf: { width: 297, height: 210, padding: [8, 8, 8, 8] },
  schemas: [
    [
      // Branded side panel
      {
        name: "brandPanelBg",
        type: "rectangle",
        position: { x: 212, y: 0 },
        width: 85,
        height: 210,
        color: "#FFF1C7",
        borderColor: "#FFF1C7",
        readOnly: true,
      },
      {
        name: "brandAccent",
        type: "rectangle",
        position: { x: 212, y: 0 },
        width: 2,
        height: 210,
        color: "#FFC928",
        borderColor: "#FFC928",
        readOnly: true,
      },
      {
        name: "brandTitle",
        type: "text",
        position: { x: 220, y: 20 },
        width: 68,
        height: 20,
        fontSize: 13,
        fontColor: "#68401F",
        alignment: "left",
        dynamicFontSize: { min: 10, max: 13, fit: "vertical" },
      },
      {
        name: "voucherTitle",
        type: "text",
        position: { x: 12, y: 13 },
        width: 110,
        height: 13,
        fontSize: 21,
        fontColor: "#292522",
      },
      {
        name: "brandSubtitle",
        type: "text",
        position: { x: 14, y: 29 },
        width: 182,
        height: 6,
        fontSize: 8,
        fontColor: "#956019",
      },

      // Ticket, date and status — always visible at the top of the data area
      {
        name: "ticketId",
        type: "text",
        position: { x: 125, y: 13 },
        width: 77,
        height: 7,
        fontSize: 9,
        fontColor: "#68401F",
        alignment: "right",
      },
      {
        name: "statusBadge",
        type: "text",
        position: { x: 125, y: 21 },
        width: 77,
        height: 6,
        fontSize: 7,
        fontColor: "#047857",
        alignment: "right",
        dynamicFontSize: { min: 5.8, max: 7, fit: "shrink" },
      },
      {
        name: "metaDivider",
        type: "line",
        position: { x: 12, y: 38 },
        width: 190,
        height: 0.5,
        color: "#E7C66E",
        readOnly: true,
      },
      {
        name: "bookingDateText",
        type: "text",
        position: { x: 12, y: 41 },
        width: 78,
        height: 6,
        fontSize: 7.5,
        fontColor: "#6B5A48",
      },
      {
        name: "paymentIdText",
        type: "text",
        position: { x: 91, y: 41 },
        width: 89,
        height: 6,
        fontSize: 7,
        fontColor: "#6B5A48",
        dynamicFontSize: { min: 5.5, max: 7, fit: "shrink" },
      },
      {
        name: "securityBadge",
        type: "text",
        position: { x: 164, y: 32 },
        width: 38,
        height: 5,
        fontSize: 6,
        fontColor: "#956019",
        alignment: "right",
      },

      // Passenger and contact information
      {
        name: "sec1Title",
        type: "text",
        position: { x: 12, y: 51 },
        width: 190,
        height: 6,
        fontSize: 9,
        fontColor: "#68401F",
      },
      {
        name: "sec1Bg",
        type: "rectangle",
        position: { x: 12, y: 58 },
        width: 190,
        height: 31,
        color: "#FFFFFF",
        borderColor: "#E7D9B7",
        readOnly: true,
      },
      {
        name: "custNameLbl",
        type: "text",
        position: { x: 16, y: 62 },
        width: 54,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "customerName",
        type: "text",
        position: { x: 16, y: 67 },
        width: 54,
        height: 6,
        fontSize: 9,
        fontColor: "#292522",
        dynamicFontSize: { min: 6.5, max: 9, fit: "shrink" },
      },
      {
        name: "custPhoneLbl",
        type: "text",
        position: { x: 74, y: 62 },
        width: 43,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "customerPhone",
        type: "text",
        position: { x: 74, y: 67 },
        width: 43,
        height: 6,
        fontSize: 8.5,
        fontColor: "#292522",
        dynamicFontSize: { min: 6.5, max: 8.5, fit: "shrink" },
      },
      {
        name: "custEmailLbl",
        type: "text",
        position: { x: 121, y: 62 },
        width: 76,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "customerEmail",
        type: "text",
        position: { x: 121, y: 67 },
        width: 76,
        height: 6,
        fontSize: 8,
        fontColor: "#292522",
        dynamicFontSize: { min: 5.7, max: 8, fit: "shrink" },
      },
      {
        name: "paxLbl",
        type: "text",
        position: { x: 16, y: 78 },
        width: 48,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "passengerInfo",
        type: "text",
        position: { x: 64, y: 78 },
        width: 132,
        height: 5,
        fontSize: 7.5,
        fontColor: "#292522",
        dynamicFontSize: { min: 6, max: 7.5, fit: "shrink" },
      },

      // Journey information
      {
        name: "sec2Title",
        type: "text",
        position: { x: 12, y: 94 },
        width: 190,
        height: 6,
        fontSize: 9,
        fontColor: "#68401F",
      },
      {
        name: "sec2Bg",
        type: "rectangle",
        position: { x: 12, y: 101 },
        width: 190,
        height: 48,
        color: "#FFFFFF",
        borderColor: "#E7D9B7",
        readOnly: true,
      },
      {
        name: "srvLbl",
        type: "text",
        position: { x: 16, y: 104 },
        width: 86,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "serviceName",
        type: "text",
        position: { x: 16, y: 109 },
        width: 86,
        height: 7,
        fontSize: 9,
        fontColor: "#292522",
        dynamicFontSize: { min: 6.5, max: 9, fit: "shrink" },
      },
      {
        name: "vehLbl",
        type: "text",
        position: { x: 110, y: 104 },
        width: 86,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "vehicleName",
        type: "text",
        position: { x: 110, y: 109 },
        width: 86,
        height: 7,
        fontSize: 9,
        fontColor: "#292522",
        dynamicFontSize: { min: 6.5, max: 9, fit: "shrink" },
      },
      {
        name: "pickTimeLbl",
        type: "text",
        position: { x: 16, y: 119 },
        width: 86,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "pickupTime",
        type: "text",
        position: { x: 16, y: 124 },
        width: 86,
        height: 7,
        fontSize: 8.5,
        fontColor: "#292522",
        dynamicFontSize: { min: 6, max: 8.5, fit: "shrink" },
      },
      {
        name: "pickAddrLbl",
        type: "text",
        position: { x: 16, y: 134 },
        width: 86,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "pickupAddress",
        type: "text",
        position: { x: 16, y: 139 },
        width: 86,
        height: 9,
        fontSize: 7.5,
        fontColor: "#292522",
        dynamicFontSize: { min: 5.5, max: 7.5, fit: "vertical" },
      },
      {
        name: "dropAddrLbl",
        type: "text",
        position: { x: 110, y: 134 },
        width: 86,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "dropAddress",
        type: "text",
        position: { x: 110, y: 139 },
        width: 86,
        height: 9,
        fontSize: 7.5,
        fontColor: "#292522",
        dynamicFontSize: { min: 5.5, max: 7.5, fit: "vertical" },
      },

      // Fare summary with prominent total, advance, and balance
      {
        name: "sec3Title",
        type: "text",
        position: { x: 12, y: 154 },
        width: 190,
        height: 6,
        fontSize: 9,
        fontColor: "#68401F",
      },
      {
        name: "sec3Bg",
        type: "rectangle",
        position: { x: 12, y: 161 },
        width: 190,
        height: 33,
        color: "#FFFAEC",
        borderColor: "#E7D9B7",
        readOnly: true,
      },
      {
        name: "fareTotLbl",
        type: "text",
        position: { x: 16, y: 164 },
        width: 53,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "fareTotalVal",
        type: "text",
        position: { x: 16, y: 169 },
        width: 53,
        height: 7,
        fontSize: 12,
        fontColor: "#292522",
        dynamicFontSize: { min: 9, max: 12, fit: "shrink" },
      },
      {
        name: "fareAdvLbl",
        type: "text",
        position: { x: 78, y: 164 },
        width: 49,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "fareAdvVal",
        type: "text",
        position: { x: 78, y: 169 },
        width: 49,
        height: 7,
        fontSize: 12,
        fontColor: "#047857",
        dynamicFontSize: { min: 9, max: 12, fit: "shrink" },
      },
      {
        name: "fareBalLbl",
        type: "text",
        position: { x: 137, y: 164 },
        width: 59,
        height: 4,
        fontSize: 6.5,
        fontColor: "#8A7B6C",
      },
      {
        name: "fareBalVal",
        type: "text",
        position: { x: 137, y: 169 },
        width: 59,
        height: 7,
        fontSize: 12,
        fontColor: "#9A3412",
        dynamicFontSize: { min: 9, max: 12, fit: "shrink" },
      },
      {
        name: "fareNote",
        type: "text",
        position: { x: 16, y: 178 },
        width: 180,
        height: 14,
        fontSize: 6.3,
        fontColor: "#6B5A48",
        dynamicFontSize: { min: 5.2, max: 6.3, fit: "vertical" },
      },

      // Side-panel contact information and important booking notes
      {
        name: "ftHelp",
        type: "text",
        position: { x: 220, y: 57 },
        width: 68,
        height: 19,
        fontSize: 8,
        fontColor: "#68401F",
        dynamicFontSize: { min: 6.5, max: 8, fit: "vertical" },
      },
      {
        name: "ftAddr",
        type: "text",
        position: { x: 220, y: 81 },
        width: 68,
        height: 24,
        fontSize: 7,
        fontColor: "#68401F",
        dynamicFontSize: { min: 5.8, max: 7, fit: "vertical" },
      },
      {
        name: "noticeBg",
        type: "rectangle",
        position: { x: 218, y: 115 },
        width: 73,
        height: 61,
        color: "#FFE6A0",
        borderColor: "#F1D17A",
        readOnly: true,
      },
      {
        name: "noticeTitle",
        type: "text",
        position: { x: 222, y: 119 },
        width: 65,
        height: 8,
        fontSize: 7.7,
        fontColor: "#68401F",
        dynamicFontSize: { min: 6.2, max: 7.7, fit: "shrink" },
      },
      {
        name: "noticeBody",
        type: "text",
        position: { x: 222, y: 128 },
        width: 65,
        height: 44,
        fontSize: 6.7,
        fontColor: "#68401F",
        dynamicFontSize: { min: 5.5, max: 6.7, fit: "vertical" },
      },
      {
        name: "divLine",
        type: "line",
        position: { x: 218, y: 182 },
        width: 70,
        height: 0.5,
        color: "#D9B65C",
        readOnly: true,
      },
      {
        name: "ftDisc",
        type: "text",
        position: { x: 220, y: 186 },
        width: 68,
        height: 15,
        fontSize: 5.8,
        fontColor: "#8A6C45",
        dynamicFontSize: { min: 5, max: 5.8, fit: "vertical" },
      },
    ],
  ],
};
