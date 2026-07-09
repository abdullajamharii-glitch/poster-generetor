"use client";

import React from "react";
import { Stage, Layer, Rect, Text as KonvaText, Group } from "react-konva";
import useImage from "use-image";
import URLImage from "./URLImage";
import { PosterTemplate, TextElementData } from "@/lib/types";

interface PreviewStageProps {
  template: PosterTemplate;
  zoom: number;
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string | null) => void;
  onHover?: (id: string | null) => void;
}

export default function PreviewStage({
  template,
  zoom,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: PreviewStageProps) {
  const [bg] = useImage(template.background || "", "anonymous");
  const sorted = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);

  const hoveredEl = hoveredId
    ? template.elements.find((e) => e.id === hoveredId)
    : null;

  const selectedEl = selectedId
    ? template.elements.find((e) => e.id === selectedId)
    : null;

  const handleStageClick = (e: any) => {
    // If clicked on background/stage empty space, deselect
    if (e.target === e.target.getStage()) {
      onSelect?.(null);
    }
  };

  return (
    <div
      className="checker-bg shadow-panel rounded-sm relative overflow-hidden"
      style={{ width: template.width * zoom, height: template.height * zoom }}
    >
      <Stage
        width={template.width * zoom}
        height={template.height * zoom}
        scaleX={zoom}
        scaleY={zoom}
        onClick={handleStageClick}
        onTouchEnd={handleStageClick}
      >
        {/* Layer set to listening={true} so we catch clicks and hover actions */}
        <Layer listening={true}>
          {/* Canvas solid background */}
          <Rect
            x={0}
            y={0}
            width={template.width}
            height={template.height}
            fill={template.backgroundColor}
          />

          {/* Locked background poster image */}
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

          {/* Render Elements & Placeholders */}
          {sorted.map((el) => {
            if (!el.visible) return null;

            if (el.type === "image") {
              const isInteractive = !!el.placeholderKey;
              return (
                <URLImage
                  key={el.id}
                  el={el}
                  draggable={false}
                  onChange={() => {}}
                  onSelect={() => isInteractive && onSelect?.(el.id)}
                  shapeRef={() => {}}
                  onMouseEnter={(e) => {
                    if (isInteractive) {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = "pointer";
                      onHover?.(el.id);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isInteractive) {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = "default";
                      onHover?.(null);
                    }
                  }}
                />
              );
            }

            const t = el as TextElementData;
            const cover = t.coverConfig;
            const isInteractive = t.text.includes("{{") || t.name !== "";

            return (
              <React.Fragment key={t.id}>
                {/* Background cover rect to hide original baked-in text */}
                {cover?.enabled && (
                  <Rect
                    x={t.x - cover.padding}
                    y={t.y - cover.padding}
                    width={t.width + cover.padding * 2}
                    height={Math.max(t.fontSize * (t.lineHeight || 1.2), t.height) + cover.padding * 2}
                    fill={cover.color}
                    opacity={cover.opacity}
                    cornerRadius={cover.radius}
                    listening={false}
                  />
                )}

                <KonvaText
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
                  onClick={() => isInteractive && onSelect?.(t.id)}
                  onTap={() => isInteractive && onSelect?.(t.id)}
                  onMouseEnter={(e) => {
                    if (isInteractive) {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = "pointer";
                      onHover?.(t.id);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isInteractive) {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = "default";
                      onHover?.(null);
                    }
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* ── Hover Glow Overlay ── */}
          {hoveredEl && (
            <Rect
              x={hoveredEl.x - 2}
              y={hoveredEl.y - 2}
              width={hoveredEl.width + 4}
              height={
                (hoveredEl.type === "text"
                  ? Math.max(
                      (hoveredEl as any).fontSize * ((hoveredEl as any).lineHeight || 1.2),
                      hoveredEl.height
                    )
                  : hoveredEl.height) + 4
              }
              rotation={hoveredEl.rotation}
              stroke="#3b5bfd"
              strokeWidth={2}
              shadowColor="#3b5bfd"
              shadowBlur={8}
              cornerRadius={2}
              listening={false}
            />
          )}

          {/* ── Hover Tooltip Badge ── */}
          {hoveredEl && (
            <Group
              x={hoveredEl.x}
              y={hoveredEl.y - 24 < 5 ? hoveredEl.y + (hoveredEl.type === "text" ? Math.max((hoveredEl as any).fontSize * ((hoveredEl as any).lineHeight || 1.2), hoveredEl.height) : hoveredEl.height) + 5 : hoveredEl.y - 24}
              listening={false}
            >
              <Rect
                fill="#3b5bfd"
                height={20}
                width={hoveredEl.type === "text" ? 92 : 106}
                cornerRadius={4}
                shadowColor="#000000"
                shadowBlur={4}
                shadowOpacity={0.15}
              />
              <KonvaText
                text={hoveredEl.type === "text" ? "📝 Click to Edit" : "🖼️ Replace Image"}
                fill="#ffffff"
                fontSize={10}
                fontFamily="system-ui, sans-serif"
                fontStyle="bold"
                x={7}
                y={5}
              />
            </Group>
          )}

          {/* ── Selection Outline Overlay ── */}
          {selectedEl && (
            <Rect
              x={selectedEl.x - 3}
              y={selectedEl.y - 3}
              width={selectedEl.width + 6}
              height={
                (selectedEl.type === "text"
                  ? Math.max(
                      (selectedEl as any).fontSize * ((selectedEl as any).lineHeight || 1.2),
                      selectedEl.height
                    )
                  : selectedEl.height) + 6
              }
              rotation={selectedEl.rotation}
              stroke="#3b5bfd"
              strokeWidth={2.5}
              cornerRadius={2}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
