"use client";

import React from "react";
import { Stage, Layer, Rect, Text as KonvaText } from "react-konva";
import useImage from "use-image";
import URLImage from "./URLImage";
import { PosterTemplate, TextElementData } from "@/lib/types";

export default function PreviewStage({
  template,
  zoom,
}: {
  template: PosterTemplate;
  zoom: number;
}) {
  const [bg] = useImage(template.background || "", "anonymous");
  const sorted = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className="checker-bg shadow-panel rounded-sm"
      style={{ width: template.width * zoom, height: template.height * zoom }}
    >
      <Stage width={template.width * zoom} height={template.height * zoom} scaleX={zoom} scaleY={zoom}>
        <Layer listening={false}>
          <Rect x={0} y={0} width={template.width} height={template.height} fill={template.backgroundColor} />
          {bg && (
            <URLImage
              el={{
                id: "__bg__",
                type: "image",
                name: "Background",
                x: 0,
                y: 0,
                width: template.width,
                height: template.height,
                rotation: 0,
                zIndex: -1,
                locked: true,
                visible: true,
                opacity: 1,
                src: template.background as string,
                fit: "cover",
                cornerRadius: 0,
              }}
              draggable={false}
              onChange={() => {}}
              onSelect={() => {}}
              shapeRef={() => {}}
            />
          )}
          {sorted.map((el) => {
            if (!el.visible) return null;
            if (el.type === "image") {
              return (
                <URLImage
                  key={el.id}
                  el={el}
                  draggable={false}
                  onChange={() => {}}
                  onSelect={() => {}}
                  shapeRef={() => {}}
                />
              );
            }
            const t = el as TextElementData;
            return (
              <KonvaText
                key={t.id}
                x={t.x}
                y={t.y}
                width={t.width}
                text={t.text}
                fontFamily={t.fontFamily}
                fontSize={t.fontSize}
                fontStyle={`${t.fontStyle} ${t.fontWeight === "bold" ? "bold" : ""}`.trim()}
                fill={t.fill}
                align={t.align}
                letterSpacing={t.letterSpacing}
                lineHeight={t.lineHeight}
                rotation={t.rotation}
                opacity={t.opacity}
                shadowEnabled={t.shadow.enabled}
                shadowColor={t.shadow.color}
                shadowBlur={t.shadow.blur}
                shadowOffsetX={t.shadow.offsetX}
                shadowOffsetY={t.shadow.offsetY}
                shadowOpacity={t.shadow.opacity}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
