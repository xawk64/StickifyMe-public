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

exports.generateBarcode = async (req, res) => {
  const file = fs.createWriteStream("example.pdf");
  const mode = req.body.mode;
  const withEac = req.body.withEAC;

  const orders = req.body.orders;

  const pageOffsetX = 14;
  const pageOffsetY = 20;

  const stickerWidth = 58;
  const stickerHeight = 40;

  const barcodeWidth = 35;
  const barcodeHeight = 20;

  const coff = mode === 1.96;

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

  const count = orders.length;

  const maxX = Math.ceil(count / 3);
  const maxY = count - (maxX - 1) * 3;

  const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  let x = -1;
  console.log(mode, withEac, "info");

  const drawProductSticker = (order) => {
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

    ctx.doc.addSVG(svgText, 19, 35, {
      width: 75,
      height: 50,
      preserveAspectRatio: "10",
    });

    ctx.doc.fontSize(6);
    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(order.product.barcode[0], 15, 70);

    ctx.doc.fontSize(6);
    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(order.product.barcode.substring(1, 7), 22, 70, {
        characterSpacing: 3,
      });

    ctx.doc.fontSize(6);
    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(order.product.barcode.substring(7), 58.5, 70, {
        characterSpacing: 3,
      });

    ctx.doc.fontSize(6);
    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(order.product.title, 5, 5);

    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(`Цвет: ${order.product.characteristics["Цвет"]?.[0] || ""}`, 5, 18);
    ctx.doc.fontSize(5);
    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(`Артикул: ${order.nmId || ""}`, 5, 25);

    ctx.doc.fontSize(5);
    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(
        `Страна: ${order.product.characteristics["Страна производства"]?.[0]}`,
        5,
        30
      );
    ctx.doc.fontSize(5);
    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(`Производитель: ${order.product.brand || ""}`, 5, 35);

    ctx.doc.fontSize(6);
    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(`${order.bcUp || ""}`, 30, 41);
    ctx.doc
      .font(`server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`)
      .text(`${order.bcDown || ""}`, 65, 41);
    if (withEac) {
      ctx.doc.addSVG(eacIcon, 100, 61, {
        width: 10,
        height: 10,
        preserveAspectRatio: "10",
      });
    }
  };

  const drawWbSticker = (wbSvgSticker) => {
    ctx.doc.addSVG(wbSvgSticker, 0, -18, {
      width: 114,
      height: 114,
      preserveAspectRatio: "10",
    });
  };

  if (mode === "a4") {
    for (let X = 0; X < maxX; X++) {
      x++;
      if (x % 6 === 0 && x !== 0) {
        x = 0;
        ctx.doc.addPage({
          size: "A4",
          margin: 0,
        });
      }
      for (let Y = 0; Y < (X === maxX - 1 ? maxY : 3); Y++) {
        const y = Y;
        const order = orders[X * 3 + y];

        // JsBarcode(svgNode, row[2], {
        //   format: "ean13",
        //   fontSize: 18,
        //   textMargin: 0,
        //   margin: 0,
        //   width: 2,
        //   xmlDocument: document,
        // });

        // const svgText = xmlSerializer.serializeToString(svgNode);

        // ctx.doc.addSVG(
        //   svgText,
        //   pageOffsetX * coff +
        //     y * stickerWidth * coff +
        //     y * gapX * coff +
        //     (stickerWidth - barcodeWidth - 2) * coff,
        //   pageOffsetY * coff +
        //     x * stickerHeight * coff +
        //     x * gapY * coff +
        //     2 * coff,
        //   { width: 100, height: 50, preserveAspectRatio: "10" }
        // );

        if (withEac) {
          ctx.doc.addSVG(
            eacIcon,
            pageOffsetX * coff +
              y * stickerWidth * coff +
              y * gapX * coff +
              145,
            pageOffsetY * coff +
              x * stickerHeight * coff +
              x * gapY * coff +
              96,
            {
              width: 10,
              height: 10,
              preserveAspectRatio: "10",
            }
          );
        }
        ctx.rect(
          pageOffsetX * coff + y * stickerWidth * coff + y * gapX * coff,
          pageOffsetY * coff + x * stickerHeight * coff + x * gapY * coff,
          stickerWidth * coff,
          stickerHeight * coff
        );

        ctx.doc.fontSize(6);
        // if (row[3]) {
        //   ctx.doc
        //     .font(
        //       `server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`
        //     )
        //     .text(
        //       `Артикул: ${row[3]}`,
        //       pageOffsetX * coff +
        //         y * stickerWidth * coff +
        //         y * gapX * coff +
        //         10,
        //       pageOffsetY * coff +
        //         x * stickerHeight * coff +
        //         x * gapY * coff +
        //         10
        //     );
        // }
        // if (row[4]) {
        //   ctx.doc
        //     .font(
        //       `server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`
        //     )
        //     .text(
        //       `Цвет: ${row[4]}`,
        //       pageOffsetX * coff +
        //         y * stickerWidth * coff +
        //         y * gapX * coff +
        //         10,
        //       pageOffsetY * coff +
        //         x * stickerHeight * coff +
        //         x * gapY * coff +
        //         20
        //     );
        // }
        // if (row[5]) {
        //   ctx.doc
        //     .font(
        //       `server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`
        //     )
        //     .text(
        //       `Размер: ${row[5]}`,
        //       pageOffsetX * coff +
        //         y * stickerWidth * coff +
        //         y * gapX * coff +
        //         10,
        //       pageOffsetY * coff +
        //         x * stickerHeight * coff +
        //         x * gapY * coff +
        //         30
        //     );
        // }
        // if (row[6]) {
        //   ctx.doc
        //     .font(
        //       `server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`
        //     )
        //     .text(
        //       `Название товара: ${row[6]}`,
        //       pageOffsetX * coff +
        //         y * stickerWidth * coff +
        //         y * gapX * coff +
        //         10,
        //       pageOffsetY * coff +
        //         x * stickerHeight * coff +
        //         x * gapY * coff +
        //         70
        //     );
        // }
        // if (row[7]) {
        //   ctx.doc
        //     .font(
        //       `server-app/assets/fonts/PT-Astra-Sans/PT-Astra-Sans_Regular.ttf`
        //     )
        //     .text(
        //       `Наименование продавца: ${row[7]}`,
        //       pageOffsetX * coff +
        //         y * stickerWidth * coff +
        //         y * gapX * coff +
        //         10,
        //       pageOffsetY * coff +
        //         x * stickerHeight * coff +
        //         x * gapY * coff +
        //         80
        //     );
        // }

        ctx.stroke();
      }
    }
  } else {
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];

      drawProductSticker(order);

      const wbSvgSticker = Buffer.from(order.barcodeFile, "base64").toString();

      if (wbSvgSticker) {
        ctx.doc.addPage({
          size:
            mode === "thermo"
              ? [stickerWidth * coff, stickerHeight * coff]
              : "A4",
          margin: 0,
        });
        drawWbSticker(wbSvgSticker);
      }

      if (i < orders.length - 1) {
        ctx.doc.addPage({
          size: [stickerWidth * coff, stickerHeight * coff],
          margin: 0,
        });
      }
    }
  }

  ctx.stream.on("finish", function () {
    file.end();
    res.set("Content-disposition", "attachment; filename=" + "example.pdf");
    res.set("Content-Type", "text/plain");

    res.download("example.pdf");
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
