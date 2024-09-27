PDFDocument = require("pdfkit");
const fs = require("fs");
const canvas2pdf = require("canvas2pdf");
const JsBarcode = require("jsbarcode");
const QRCode = require("qrcode");
const { DOMImplementation, XMLSerializer } = require("xmldom");
const SVGtoPDF = require("svg-to-pdfkit");
const db = require("../models");
const BarcodesHistory = db.barcodesHistory;

PDFDocument.prototype.addSVG = function (svg, x, y, options) {
  return SVGtoPDF(this, svg, x, y, options), this;
};

const eacIcon = `<svg xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:ns1="http://sozi.baierouge.fr" xmlns:cc="http://web.resource.org/cc/" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" viewBox="0 0 500 500">
<g id="imagebot_2" label="Layer 1">
  <path id="imagebot_3" fill-rule="evenodd" fill="#161413" d="m221.96 59.31v54.36 54.38 54.36h54.37v-54.36-54.38-54.36h-54.37zm-54.37-54.372h54.37 54.37 54.36v54.372 54.36 54.38 54.36 54.36 54.37 54.37 54.36 54.37h-54.36v-54.37-54.36-54.37-54.37h-54.37v54.37 54.37 54.36 54.37h-54.37v-54.37-54.36-54.37-54.37-54.36-54.36-54.38-54.36-54.372zm-163.1 0h54.372 54.362v54.372h-54.361v54.36 54.38 54.36h54.361v54.36h-54.361v54.37 54.37 54.36h54.361v54.37h-54.361-54.372l-0.0005-54.37v-54.36-54.37-54.37-54.36-54.36-54.38-54.36-54.372zm380.57 0h54.37 54.37v54.372h-54.37v54.36 54.38 54.36 54.36 54.37 54.37 54.36h54.37v54.37h-54.37-54.37v-54.37-54.36-54.37-54.37-54.36-54.36-54.38-54.36-54.372z" label="Layer 1"/>
  <title>Layer 1</title>
</g>
</svg>`;

const fontURL =
  "server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf";

const truncateText = (text, count = 60) => {
  return text.substring(0, count) + (text.length < count ? "" : "...");
};

exports.generateBarcode = async (req, res) => {
  const file = fs.createWriteStream("stickers.pdf");
  const mode = req.body.mode;
  const withEac = req.body.withEAC;

  const orders = req.body.orders;

  const pageOffsetX = 14;
  const pageOffsetY = 20;

  const stickerWidth = 58;
  const stickerHeight = 40;

  const coff = mode === "thermo" ? 1.96 : 2.8;

  const gapY = 6;
  const gapX = 5;

  //Create a new PDF canvas context.
  const ctx = new canvas2pdf.PdfContext(file, {
    size:
      mode === "thermo" ? [stickerWidth * coff, stickerHeight * coff] : "A4",
    margin: 0,
  });

  const xmlSerializer = new XMLSerializer();
  const document = new DOMImplementation().createDocument(
    "http://www.w3.org/1999/xhtml",
    "html",
    null
  );

  const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  const drawProductSticker = (order, coff = 1, offsetX = 0, offsetY = 0) => {
    JsBarcode(svgNode, order.product.barcode, {
      format: "ean13",
      fontSize: 18,
      textMargin: 0,
      margin: 0,
      width: 3.5,
      xmlDocument: document,
      displayValue: false,
    });

    const svgText = xmlSerializer.serializeToString(svgNode);

    //штрихкод
    ctx.doc.addSVG(svgText, 19 * coff + offsetX, 35 * coff + offsetY, {
      width: 75 * coff,
      height: 50 * coff,
      preserveAspectRatio: "10",
    });

    //цифры под штрихкодом
    ctx.doc.fontSize(6 * coff);
    ctx.doc
      .font(fontURL)
      .text(order.product.barcode[0], 15 * coff + offsetX, 70 * coff + offsetY);

    ctx.doc
      .font(fontURL)
      .text(
        order.product.barcode.substring(1, 7),
        22 * coff + offsetX,
        70 * coff + offsetY,
        {
          characterSpacing: 3 * coff,
        }
      );

    ctx.doc
      .font(fontURL)
      .text(
        order.product.barcode.substring(7),
        58.5 * coff + offsetX,
        70 * coff + offsetY,
        {
          characterSpacing: 3 * coff,
        }
      );

    //наименование товара
    ctx.doc
      .font(fontURL)
      .text(
        truncateText(order.product.title),
        5 * coff + offsetX,
        5 * coff + offsetY,
        { width: 100 * coff }
      );

    ctx.doc
      .font(fontURL)
      .text(
        truncateText(
          `Цвет: ${order.product.characteristics["Цвет"]?.[0] || ""}`,
          40
        ),
        5 * coff + offsetX,
        18 * coff + offsetY
      );
    ctx.doc.fontSize(5 * coff);
    ctx.doc
      .font(fontURL)
      .text(
        truncateText(`Артикул: ${order.nmId || ""}`, 40),
        5 * coff + offsetX,
        25 * coff + offsetY
      );

    ctx.doc
      .font(fontURL)
      .text(
        truncateText(
          `Страна: ${order.product.characteristics["Страна производства"]?.[0]}`,
          40
        ),
        5 * coff + offsetX,
        30 * coff + offsetY
      );

    ctx.doc
      .font(fontURL)
      .text(
        truncateText(`Производитель: ${order.product.brand || ""}`, 40),
        5 * coff + offsetX,
        35 * coff + offsetY
      );

    ctx.doc.fontSize(6 * coff);

    //шк верх
    ctx.doc
      .font(fontURL)
      .text(`${order.bcUp || ""}`, 30 * coff + offsetX, 41 * coff + offsetY);

    //шк низ
    ctx.doc
      .font(fontURL)
      .text(`${order.bcDown || ""}`, 65 * coff + offsetX, 41 * coff + offsetY);

    if (withEac) {
      ctx.doc.addSVG(eacIcon, 100 * coff + offsetX, 61 * coff + offsetY, {
        width: 10 * coff,
        height: 10 * coff,
        preserveAspectRatio: "10",
      });
    }
  };

  const drawWbSticker = (wbSticker, coff = 1, offsetX = 0, offsetY = 0) => {
    const width = 114 * coff;
    ctx.doc.image(wbSticker, 0 + offsetX, 0 + offsetY, {
      width,
      height: width * (stickerHeight / stickerWidth),
    });
  };

  if (mode === "a4") {
    const count = orders.length * 2;

    const maxX = Math.ceil(count / 3);
    const maxY = count - (maxX - 1) * 3;

    let x = -1;

    let orderCounter = 0;
    const pagesInfo = [];
    let pageInfo = [];

    for (let X = 0; X < maxX; X++) {
      x++;
      if (x % 6 === 0 && x !== 0) {
        x = 0;
        pagesInfo.unshift(pageInfo);
        pageInfo = [];
      }
      for (let Y = 0; Y < (X === maxX - 1 ? maxY : 3); Y++) {
        const y = Y;

        const isProductSticker = (X + Y) % 2 == 0;

        const order = orders[orderCounter];

        const offsetX =
          pageOffsetX * coff + y * stickerWidth * coff + y * gapX * coff;
        const offsetY =
          pageOffsetY * coff + x * stickerHeight * coff + x * gapY * coff;

        pageInfo.push({
          offsetX,
          offsetY,
          order,
          isProductSticker,
        });
        if (!isProductSticker) {
          orderCounter++;
        }
      }
    }

    pagesInfo.unshift(pageInfo);

    for (let x = 0; x < pagesInfo.length; x++) {
      const pageInfo = pagesInfo[x];

      for (let y = 0; y < pageInfo.length; y++) {
        const { offsetX, offsetY, order, isProductSticker } = pageInfo[y];
        if (isProductSticker) {
          drawProductSticker(order, coff / 1.96, offsetX, offsetY);
          if (withEac) {
            ctx.doc.addSVG(eacIcon, offsetX + 145, offsetY + 96, {
              width: 10,
              height: 10,
              preserveAspectRatio: "10",
            });
          }
        } else {
          const wbSticker = Buffer.from(order.barcodeFile, "base64");
          if (wbSticker) {
            drawWbSticker(wbSticker, coff / 1.96, offsetX, offsetY);
          }
        }

        ctx.rect(offsetX, offsetY, stickerWidth * coff, stickerHeight * coff);
        ctx.stroke();
      }
      if (x < pagesInfo.length - 1) {
        ctx.doc.addPage({
          size: "A4",
          margin: 0,
        });
      }
    }
  } else {
    for (let i = orders.length - 1; i >= 0; i--) {
      const order = orders[i];
      const wbSticker = Buffer.from(order.barcodeFile, "base64");
      if (wbSticker) {
        drawWbSticker(wbSticker);
        ctx.doc.addPage({
          size:
            mode === "thermo"
              ? [stickerWidth * coff, stickerHeight * coff]
              : "A4",
          margin: 0,
        });
      }

      drawProductSticker(order);

      if (i > 0) {
        ctx.doc.addPage({
          size: [stickerWidth * coff, stickerHeight * coff],
          margin: 0,
        });
      }
    }
  }

  ctx.stream.on("finish", function () {
    file.end();
    res.set("Content-disposition", "attachment; filename=" + "stickers.pdf");
    res.set("Content-Type", "text/plain");

    res.download("stickers.pdf");
  });
  ctx.end();
};

exports.getHistory = (req, res) => {
  if (req.query.page > 0) {
    console.log(req.userId);
    BarcodesHistory.find({ userId: req.userId }, (err, history) => {
      if (err) {
        res.status(500).send({ message: err });
      }

      if (history.length) {
        let limit = req.query.limit;
        let page = req.query.page;

        let startIndex = (page - 1) * limit;
        let endIndex = page * limit;

        let result = history.slice(startIndex, endIndex).map((item) => {
          const newItem = { ...item._doc };
          delete newItem.rows;
          delete newItem.userId;
          return newItem;
        });

        res.status(200).json({ items: result, count: history.length });
      } else {
        res.status(200).json({ items: [], count: 0 });
      }
    });
  } else {
    res.status(200).json({ items: [], count: 0 });
  }
};

exports.getHistoryById = (req, res) => {
  if (req.params.historyId) {
    BarcodesHistory.findById(req.params.historyId, (err, history) => {
      if (err) {
        res.status(500).send({ message: err });
      }

      if (history && req.userId === history.userId) {
        res.status(200).json(history);
      } else {
        res.status(200).json({});
      }
    });
  } else {
    res.status(200).json({});
  }
};
