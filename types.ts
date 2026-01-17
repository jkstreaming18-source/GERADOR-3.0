
export enum Mode {
  CREATE = 'create',
  EDIT = 'edit'
}

export type FunctionType = 
  | 'free' | 'sticker' | 'text' | 'comic'
  | 'add-remove' | 'retouch' | 'style' | 'compose';

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface AppState {
  mode: Mode;
  selectedFunction: FunctionType;
  aspectRatio: AspectRatio;
  prompt: string;
  image1: ImageData | null;
  image2: ImageData | null;
  resultImage: string | null;
  isLoading: boolean;
  statusMessage: string;
}
