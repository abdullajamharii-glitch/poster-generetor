"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Rect, Text as KonvaText, Transformer } from "react-konva";
import useImage from "use-image";
import { useEditorStore } from "@/store/useEditorStore";
import URLImage from "./URLImage";
import { TextElementData } from "@/lib/types";

export default function CanvasStage() {
  const {
    template,
    selectedIds,
    zoom,
    select,
    updateElement,
    clearSelection,
    commit,
    deleteSelected,
    duplicateSelected,
    undo,
    redo,
  } = useEditorStore();

  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [bg] = useImage(template.background || "", "anonymous");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const sorted = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);

  useEffect(() => {
    if (trRef.current) {
      const nodes = selectedIds
        .map((id) => nodeRefs.current[id])
        .filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds, template.elements.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (editingId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) {
        e.preventDefault();
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    },
    [selectedIds, editingId, deleteSelected, duplicateSelected, undo, redo]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const startEdit = (el: TextElementData) => {
    setEditingId(el.id);
    setEditValue(el.text);
  };

  const finishEdit = () => {
    if (editingId) {
      updateElement(editingId, { text: editValue });
      commit();
    }
    setEditingId(null);
  };

  const editingEl = editingId
    ? (template.elements.find((e) => e.id === editingId) as TextElementData | undefined)
    : undefined;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div
        className="checker-bg shadow-panel rounded-sm"
        style={{ width: template.width * zoom, height: template.height * zoom }}
      >
        <Stage
          ref={stageRef}
          width={template.width * zoom}
          height={template.height * zoom}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) clearSelection();
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={template.width}
              height={template.height}
              fill={template.backgroundColor}
            />
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
                    draggable={selectedIds.includes(el.id)}
                    shapeRef={(node) => (nodeRefs.current[el.id] = node)}
                    onSelect={(e) => select(el.id, e.evt?.shiftKey)}
                    onChange={(patch) => {
                      updateElement(el.id, patch);
                      commit();
                    }}
                  />
                );
              }
              const t = el as TextElementData;
              return (
                <KonvaText
                  key={t.id}
                  ref={(node) => {
                    nodeRefs.current[t.id] = node;
                  }}
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
                  opacity={editingId === t.id ? 0 : t.opacity}
                  draggable={selectedIds.includes(t.id) && !t.locked}
                  shadowEnabled={t.shadow.enabled}
                  shadowColor={t.shadow.color}
                  shadowBlur={t.shadow.blur}
                  shadowOffsetX={t.shadow.offsetX}
                  shadowOffsetY={t.shadow.offsetY}
                  shadowOpacity={t.shadow.opacity}
                  onClick={(e) => select(t.id, e.evt.shiftKey)}
                  onTap={(e) => select(t.id, (e.evt as any).shiftKey)}
                  onDblClick={() => startEdit(t)}
                  onDblTap={() => startEdit(t)}
                  onDragEnd={(e) => {
                    updateElement(t.id, { x: e.target.x(), y: e.target.y() });
                    commit();
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    node.scaleX(1);
                    node.scaleY(1);
                    updateElement(t.id, {
                      x: node.x(),
                      y: node.y(),
                      rotation: node.rotation(),
                      width: Math.max(40, t.width * scaleX),
                      fontSize: Math.max(6, Math.round(t.fontSize * node.scaleY())),
                    });
                    commit();
                  }}
                />
              );
            })}

            <Transformer
              ref={trRef}
              rotateEnabled
              flipEnabled={false}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 20 || newBox.height < 10 ? oldBox : newBox
              }
            />
          </Layer>
        </Stage>
      </div>

      {editingEl && (
        <textarea
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={finishEdit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditingId(null);
            }
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              finishEdit();
            }
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            left: editingEl.x * zoom,
            top: editingEl.y * zoom,
            width: editingEl.width * zoom,
            fontSize: editingEl.fontSize * zoom,
            fontFamily: editingEl.fontFamily,
            fontWeight: editingEl.fontWeight as any,
            color: editingEl.fill,
            lineHeight: editingEl.lineHeight,
            textAlign: editingEl.align,
            transform: `rotate(${editingEl.rotation}deg)`,
            transformOrigin: "top left",
            background: "rgba(255,255,255,0.9)",
            border: "1px dashed #3b5bfd",
            outline: "none",
            resize: "none",
            padding: 0,
            zIndex: 50,
          }}
        />
      )}
    </div>
  );
}
