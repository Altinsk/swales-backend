// controllers/uploadController.js
const { createCanvas } = require("canvas");
const { put } = require("@vercel/blob"); // Import Vercel Blob
const { successResponse, errorResponse } = require("../utils/responseHelper");

// Use pdfjs-dist v3.x (CommonJS build)
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

// Worker source
pdfjs.GlobalWorkerOptions.workerSrc = require.resolve(
  "pdfjs-dist/legacy/build/pdf.worker.js"
);

// NodeCanvasFactory remains the same
class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

// Both numPages and each page's rendered dimensions previously came
// straight from attacker-controlled PDF content with no upper bound - the
// only real limit was the 20MB file-size cap (uploadRoutes.js), which
// doesn't stop a small, valid PDF from declaring thousands of pages or one
// page with an enormous /MediaBox. Either one forces large synchronous
// in-memory canvas allocations in a loop; a handful of concurrent requests
// (well within this route's rate limit) could exhaust server memory/CPU.
const MAX_PAGES = 100;
const MAX_PAGE_DIMENSION_PX = 5000; // longest side, after scaling

exports.processPdf = async (req, res) => {
  // 1. Check for file buffer (since we are using memoryStorage)
  if (!req.file || !req.file.buffer) {
    return errorResponse(res, "No PDF file uploaded.");
  }

  const imageUrls = [];

  try {
    // 2. Load PDF directly from the memory buffer (Uint8Array)
    const fileData = new Uint8Array(req.file.buffer);
    const pdfDocument = await pdfjs.getDocument({ data: fileData }).promise;

    const numPages = pdfDocument.numPages;
    if (numPages > MAX_PAGES) {
      return errorResponse(
        res,
        `This PDF has ${numPages} pages - the maximum is ${MAX_PAGES}.`,
        null,
        400,
      );
    }
    const canvasFactory = new NodeCanvasFactory();

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      // Cap the render scale so no single page's canvas exceeds
      // MAX_PAGE_DIMENSION_PX on its longest side, regardless of what the
      // PDF's own /MediaBox declares - normal-sized pages still render at
      // the usual 1.5x, an oversized one (malicious or a genuinely huge
      // architectural sheet) gets scaled down instead of erroring or
      // ballooning memory use.
      const baseViewport = page.getViewport({ scale: 1 });
      const largestDimension = Math.max(baseViewport.width, baseViewport.height);
      const scale = Math.min(1.5, MAX_PAGE_DIMENSION_PX / largestDimension);
      const viewport = page.getViewport({ scale });

      const canvasAndContext = canvasFactory.create(
        viewport.width,
        viewport.height
      );

      const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport: viewport,
        canvasFactory: canvasFactory,
      };

      await page.render(renderContext).promise;

      // 3. Convert Canvas to Buffer
      const imageBuffer = canvasAndContext.canvas.toBuffer("image/png");

      // Generate a unique filename
      const imageName = `pdf-pages/pdf-${Date.now()}-page-${i}.png`;

      // 4. Upload directly to Vercel Blob
      const blob = await put(imageName, imageBuffer, {
        access: "public",
        contentType: "image/png", // Optional but good practice
      });

      // 5. Push the remote URL to our array
      imageUrls.push(blob.url);

      // Cleanup page resources
      page.cleanup();
      canvasFactory.destroy(canvasAndContext);
    }

    successResponse(res, "PDF processed and uploaded successfully", {
      imageUrls,
    });
  } catch (err) {
    console.error("PDF processing error:", err);
    errorResponse(res, "Failed to process PDF", err, 500);
  }
};
