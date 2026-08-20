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
    const canvasFactory = new NodeCanvasFactory();

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

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
