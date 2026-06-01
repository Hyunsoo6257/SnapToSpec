/**
 * Shared spec types for the spec-extraction pipeline.
 *
 * These mirror the DTO structure in
 * `src/module/spec-extraction/dto/{base,extract-result}.dto.ts` exactly.
 * The frontend imports/copies these interfaces to stay in sync with the
 * `POST /api/v1/spec/extract` response shape.
 */

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

export interface SpecElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpecElement {
  id: string;
  type: SpecElementType;
  label: string | null;
  position: SpecElementPosition;
  styles: SpecStyles;
}

export interface SpecResult {
  elements: SpecElement[];
}
