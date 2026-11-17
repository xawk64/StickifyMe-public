import path from "node:path";
import { DOMImplementation, XMLSerializer } from "@xmldom/xmldom";
import JsBarcode from "jsbarcode";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import { EAC_ICON_SVG } from "./eacIcon";

/** An order as it is printed: WB sticker image + product card data. */
export interface PrintableOrder {
  nmId?: number | null;
  bcUp?: string;
  bcDown?: string;
  barcodeFile: string; // base64 PNG sticker returned by the WB API
  product: {
    barcode: string; // EAN-13
    title?: string;
    vendorCode?: string;
    brand?: string;
    characteristics?: Record<string, (string | null)[]>;
  };
}

export type PrintMode = "thermo" | "a4";

export interface LabelsRequest {
  orders: PrintableOrder[];
  mode: PrintMode;
  withEAC: boolean;
}

// Geometry of a 58x40 mm sticker in PDF points (scaled by a mode coefficient).
const STICKER_WIDTH = 58;
const STICKER_HEIGHT = 40;
const PAGE_OFFSET_X = 14;
const PAGE_OFFSET_Y = 20;
const GAP_X = 5;
const GAP_Y = 6;
const THERMO_SCALE = 1.96;
const A4_SCALE = 2.8;
const A4_COLUMNS = 3;
const A4_ROWS = 6;

// resolved from the module location, so it works from src/ (tsx) and dist/ (node)
const FONT_PATH = path.join(
  __dirname,
  "../../../assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf",
);

const truncateText = (text: string | undefined, count = 60) => {
  const value = text ?? "";
  return value.substring(0, count) + (value.length < count ? "" : "...");
};

interface Cell {
  offsetX: number;
  offsetY: number;
  order: PrintableOrder;
  isProductSticker: boolean;
}

/**
 * Renders labels for printing: for every order the WB logistics sticker and
 * a product sticker (EAN-13 barcode, title, vendor code, ...).
 * - thermo: one 58x40 sticker per page
 * - a4: a 3x6 grid of stickers per A4 sheet
 */
export function renderLabelsPdf({
  orders,
  mode,
  withEAC,
}: LabelsRequest): Promise<Buffer> {
  const scale = mode === "thermo" ? THERMO_SCALE : A4_SCALE;
  const stickerPageSize: [number, number] = [
    STICKER_WIDTH * scale,
    STICKER_HEIGHT * scale,
  ];

  const doc = new PDFDocument({
    size: mode === "thermo" ? stickerPageSize : "A4",
    margin: 0,
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const svgDocument = new DOMImplementation().createDocument(
    "http://www.w3.org/1999/xhtml",
    "html",
    null,
  );
  const svgNode = svgDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  const xmlSerializer = new XMLSerializer();

  const addSvg = (svg: string, x: number, y: number, width: number, height: number) =>
    SVGtoPDF(doc, svg, x, y, { width, height, preserveAspectRatio: "10" });

  const drawProductSticker = (order: PrintableOrder, k = 1, offsetX = 0, offsetY = 0) => {
    const { product } = order;
    const characteristics = product.characteristics ?? {};
    const text = (
      value: string,
      x: number,
      y: number,
      options?: PDFKit.Mixins.TextOptions,
    ) => doc.font(FONT_PATH).text(value, k * x + offsetX, k * y + offsetY, options);

    JsBarcode(svgNode, product.barcode, {
      format: "ean13",
      fontSize: 18,
      textMargin: 0,
      margin: 0,
      width: 3.5,
      xmlDocument: svgDocument,
      displayValue: false,
    });
    addSvg(
      xmlSerializer.serializeToString(svgNode),
      19 * k + offsetX,
      35 * k + offsetY,
      75 * k,
      50 * k,
    );

    // digits under the barcode, grouped as on a printed EAN-13
    doc.fontSize(6 * k);
    text(product.barcode[0] ?? "", 15, 70);
    text(product.barcode.substring(1, 7), 22, 70, { characterSpacing: 3 * k });
    text(product.barcode.substring(7), 58.5, 70, { characterSpacing: 3 * k });

    doc.fontSize(5 * k);
    text(truncateText(product.title, 80), 5, 5, { width: 100 * k });

    doc.fontSize(4 * k);
    if (characteristics["Цвет"]) {
      text(truncateText(`Цвет: ${characteristics["Цвет"]?.[0] || ""}`, 40), 5, 17);
    }
    text(truncateText(`Артикул WB: ${order.nmId || ""}`, 40), 5, 21);
    text(truncateText(`Артикул продавца: ${product.vendorCode || ""}`, 100), 5, 25);
    if (characteristics["Страна производства"]) {
      text(
        truncateText(`Страна: ${characteristics["Страна производства"]?.[0]}`, 40),
        5,
        33,
      );
    }
    if (product.brand) {
      text(truncateText(`Производитель: ${product.brand || ""}`, 40), 5, 37);
    }

    // upper and lower parts of the WB sticker number
    doc.fontSize(6 * k);
    text(`${order.bcUp || ""}`, 30, 41);
    text(`${order.bcDown || ""}`, 65, 41);

    if (withEAC) {
      addSvg(EAC_ICON_SVG, 100 * k + offsetX, 61 * k + offsetY, 10 * k, 10 * k);
    }
  };

  const drawWbSticker = (sticker: Buffer, k = 1, offsetX = 0, offsetY = 0) => {
    const width = 114 * k;
    doc.image(sticker, offsetX, offsetY, {
      width,
      height: width * (STICKER_HEIGHT / STICKER_WIDTH),
    });
  };

  if (mode === "a4") {
    // Two stickers per order (product + WB) laid out row by row, 3 per row, 6 rows per sheet.
    const count = orders.length * 2;
    const rows = Math.ceil(count / A4_COLUMNS);
    const lastRowLength = count - (rows - 1) * A4_COLUMNS;

    const pages: Cell[][] = [];
    let page: Cell[] = [];
    let row = -1;
    let orderIndex = 0;

    for (let r = 0; r < rows; r++) {
      row++;
      if (row % A4_ROWS === 0 && row !== 0) {
        row = 0;
        pages.unshift(page);
        page = [];
      }
      for (
        let column = 0;
        column < (r === rows - 1 ? lastRowLength : A4_COLUMNS);
        column++
      ) {
        const isProductSticker = (r + column) % 2 === 0;
        const order = orders[orderIndex];
        if (order) {
          page.push({
            offsetX: PAGE_OFFSET_X * scale + column * (STICKER_WIDTH + GAP_X) * scale,
            offsetY: PAGE_OFFSET_Y * scale + row * (STICKER_HEIGHT + GAP_Y) * scale,
            order,
            isProductSticker,
          });
        }
        if (!isProductSticker) {
          orderIndex++;
        }
      }
    }
    pages.unshift(page);

    pages.forEach((cells, pageIndex) => {
      for (const { offsetX, offsetY, order, isProductSticker } of cells) {
        if (isProductSticker) {
          drawProductSticker(order, scale / THERMO_SCALE, offsetX, offsetY);
          if (withEAC) {
            addSvg(EAC_ICON_SVG, offsetX + 145, offsetY + 96, 10, 10);
          }
        } else {
          drawWbSticker(
            Buffer.from(order.barcodeFile, "base64"),
            scale / THERMO_SCALE,
            offsetX,
            offsetY,
          );
        }
        doc
          .rect(offsetX, offsetY, STICKER_WIDTH * scale, STICKER_HEIGHT * scale)
          .stroke();
      }
      if (pageIndex < pages.length - 1) {
        doc.addPage({ size: "A4", margin: 0 });
      }
    });
  } else {
    // thermo: WB sticker page, then product sticker page, for each order (in reverse order)
    for (let i = orders.length - 1; i >= 0; i--) {
      const order = orders[i];
      if (!order) {
        continue;
      }
      drawWbSticker(Buffer.from(order.barcodeFile, "base64"));
      doc.addPage({ size: stickerPageSize, margin: 0 });
      drawProductSticker(order);
      if (i > 0) {
        doc.addPage({ size: stickerPageSize, margin: 0 });
      }
    }
  }

  doc.end();
  return done;
}
