import { type IsoDateString } from "../common";
import { type GenerationVersionId, type ReferenceImageId } from "./ids";

/**
 * An image used to guide generation (start frame, end frame, style ref).
 *
 * `source` is a discriminated union because images arrive three ways and
 * each needs different handling: local files must be read through Tauri,
 * URLs are fetched, and generated frames are extracted from an existing
 * version's output (the backbone of the Extend and Loop workflows).
 */
export type ReferenceImageSource =
  | { kind: "local-file"; path: string }
  | { kind: "url"; url: string }
  | {
      kind: "generated-frame";
      versionId: GenerationVersionId;
      frame: "first" | "last";
    };

export interface ReferenceImage {
  id: ReferenceImageId;
  source: ReferenceImageSource;
  /** Pixel dimensions when known (probed lazily). */
  width: number | null;
  height: number | null;
  createdAt: IsoDateString;
}
