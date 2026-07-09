"use client";

import React from "react";
import { Image as KonvaImage, Rect, Group } from "react-konva";
import useImage from "use-image";
import { ImageElementData } from "@/lib/types";

interface Props {
  el: ImageElementData;
  draggable: boolean;
  onChange: (patch: Partial<ImageElementData>) => void;
  onSelect: (e: any) => void;
  shapeRef: (node: any) => void;
  onMouseEnter?: (e: any) => void;
  onMouseLeave?: (e: any) => void;
}

export default function URLImage({
  el,
  draggable,
  onChange,
  onSelect,
  shapeRef,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const [img] = useImage(el.src, "anonymous");

  // compute cover/contain crop
  let cropProps: any = {};
  if (img) {
    const elementRatio = el.width / el.height;
    const imgRatio = img.width / img.height;
    if (el.fit === "cover") {
      let cropW = img.width;
      let cropH = img.height;
      if (imgRatio > elementRatio) {
        cropW = img.height * elementRatio;
      } else {
        cropH = img.width / elementRatio;
      }
      cropProps = {
        crop: {
          x: (img.width - cropW) / 2,
          y: (img.height - cropH) / 2,
          width: cropW,
          height: cropH,
        },
      };
    }
  }

  return (
    <Group
      ref={shapeRef}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      opacity={el.visible ? el.opacity : 0}
      draggable={draggable && !el.locked}
      onClick={onSelect}
      onTap={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(20, el.width * scaleX),
          height: Math.max(20, el.height * scaleY),
        });
      }}
    >
      {img ? (
        <KonvaImage
          image={img}
          width={el.width}
          height={el.height}
          cornerRadius={el.cornerRadius}
          {...cropProps}
        />
      ) : (
        <Rect
          width={el.width}
          height={el.height}
          fill="#e9ecf5"
          cornerRadius={el.cornerRadius}
          dash={[6, 4]}
          stroke="#c3c9db"
        />
      )}
    </Group>
  );
}
