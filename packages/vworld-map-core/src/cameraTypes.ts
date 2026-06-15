export interface CameraState {
  center: [number, number];
  zoom: number;
  bounds?: {
    ne: [number, number];
    sw: [number, number];
  };
  pitch?: number;
  heading?: number;
}
