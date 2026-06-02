export type SpecElementType =
  | 'button'
  | 'text'
  | 'input'
  | 'image'
  | 'card'
  | 'container'
  | 'icon'
  | 'divider';

export interface SpecStyles {
  backgroundColor: string | null;
  color: string | null;
  fontSize: string | null;
  fontWeight: string | null;
  borderRadius: string | null;
  padding: string | null;
  margin: string | null;
  border: string | null;
  gap: string | null;
}

export interface SpecElement {
  id: string;
  type: SpecElementType;
  label: string | null;
  position: { x: number; y: number; width: number; height: number };
  styles: SpecStyles;
}

export interface SpecResult {
  elements: SpecElement[];
}
