import Konva from "konva";

function getStage(): Konva.Stage | undefined {
  return Konva.stages[0];
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Temporarily resets the stage to its true (unzoomed) resolution so
 * exports are always crisp regardless of the current on-screen zoom level.
 */
function withFullResolution<T>(
  templateWidth: number,
  templateHeight: number,
  fn: (stage: Konva.Stage) => T
): T | undefined {
  const stage = getStage();
  if (!stage) return undefined;
  const origW = stage.width();
  const origH = stage.height();
  const origScale = stage.scale();
  stage.width(templateWidth);
  stage.height(templateHeight);
  stage.scale({ x: 1, y: 1 });
  stage.batchDraw();
  const result = fn(stage);
  stage.width(origW);
  stage.height(origH);
  stage.scale(origScale || { x: 1, y: 1 });
  stage.batchDraw();
  return result;
}

export async function exportStageAsImage(
  templateWidth: number,
  templateHeight: number,
  name: string,
  format: "png" | "jpg",
  pixelRatio: 1 | 2 | 4
) {
  const dataUrl = withFullResolution(templateWidth, templateHeight, (stage) =>
    stage.toDataURL({
      mimeType: format === "jpg" ? "image/jpeg" : "image/png",
      quality: 1,
      pixelRatio,
    })
  );
  if (dataUrl) triggerDownload(dataUrl, `${slug(name)}.${format}`);
  return dataUrl;
}

export async function exportStageAsPDF(
  templateWidth: number,
  templateHeight: number,
  name: string,
  pixelRatio: 1 | 2 | 4 = 2
) {
  const dataUrl = withFullResolution(templateWidth, templateHeight, (stage) =>
    stage.toDataURL({ mimeType: "image/png", pixelRatio })
  );
  if (!dataUrl) return;
  const { jsPDF } = await import("jspdf");
  const orientation = templateWidth > templateHeight ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [templateWidth, templateHeight],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, templateWidth, templateHeight);
  pdf.save(`${slug(name)}.pdf`);
}

export function getStageDataUrl(
  templateWidth: number,
  templateHeight: number,
  pixelRatio: 1 | 2 | 4 = 2
) {
  return withFullResolution(templateWidth, templateHeight, (stage) =>
    stage.toDataURL({ mimeType: "image/png", pixelRatio })
  );
}

function slug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "poster";
}
