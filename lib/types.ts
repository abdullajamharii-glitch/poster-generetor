export type ElementType = "text" | "image";

export interface ShadowProps {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
}

export interface TextElementData extends BaseElement {
  type: "text";
  text: string; // may contain {{placeholder}} tokens
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "600" | "500";
  fontStyle: "normal" | "italic";
  fill: string;
  align: "left" | "center" | "right";
  letterSpacing: number;
  lineHeight: number;
  shadow: ShadowProps;
  background?: string; // optional pill/box background color
  backgroundPadding?: number;
}

export interface ImageElementData extends BaseElement {
  type: "image";
  src: string; // data URL or remote URL
  placeholderKey?: string; // e.g. "company_logo", "flight_image"
  fit: "cover" | "contain" | "fill";
  cornerRadius: number;
}

export type EditorElement = TextElementData | ImageElementData;

export interface PosterTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  background: string | null; // background image data URL
  backgroundColor: string;
  elements: EditorElement[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface GeneratedPoster {
  id: string;
  templateId: string;
  templateName: string;
  values: Record<string, string>;
  dataUrl: string;
  createdAt: number;
}

// Extract every {{placeholder}} token used across a template's text elements
// and every declared image placeholderKey.
export function extractPlaceholders(template: PosterTemplate): {
  textKeys: string[];
  imageKeys: string[];
} {
  const textKeys = new Set<string>();
  const imageKeys = new Set<string>();
  const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

  template.elements.forEach((el) => {
    if (el.type === "text") {
      let match;
      const re = new RegExp(regex);
      while ((match = re.exec(el.text)) !== null) {
        textKeys.add(match[1]);
      }
    } else if (el.type === "image" && el.placeholderKey) {
      imageKeys.add(el.placeholderKey);
    }
  });

  return { textKeys: Array.from(textKeys), imageKeys: Array.from(imageKeys) };
}

export function applyPlaceholders(
  template: PosterTemplate,
  values: Record<string, string>
): PosterTemplate {
  const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  return {
    ...template,
    elements: template.elements.map((el) => {
      if (el.type === "text") {
        const newText = el.text.replace(regex, (_, key) =>
          values[key] !== undefined ? values[key] : `{{${key}}}`
        );
        return { ...el, text: newText };
      }
      if (el.type === "image" && el.placeholderKey && values[el.placeholderKey]) {
        return { ...el, src: values[el.placeholderKey] };
      }
      return el;
    }),
  };
}
