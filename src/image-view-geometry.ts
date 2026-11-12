export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type ImagePose = Point & { scale: number };
export const MIN_IMAGE_ZOOM = 1;
export const MAX_IMAGE_ZOOM = 5;
export const initialImagePose: ImagePose = { scale: 1, x: 0, y: 0 };

export function fitImage(view: Size, image: Size): Size {
  if (Math.min(view.width, view.height, image.width, image.height) <= 0)
    return { width: 0, height: 0 };
  const ratio = Math.min(view.width / image.width, view.height / image.height);
  return { width: image.width * ratio, height: image.height * ratio };
}

export function constrainImagePose(
  pose: ImagePose,
  view: Size,
  fitted: Size,
): ImagePose {
  const scale = Math.max(MIN_IMAGE_ZOOM, Math.min(MAX_IMAGE_ZOOM, pose.scale));
  const x = Math.max(0, (fitted.width * scale - view.width) / 2);
  const y = Math.max(0, (fitted.height * scale - view.height) / 2);
  return {
    scale,
    x: x === 0 ? 0 : Math.max(-x, Math.min(x, pose.x)),
    y: y === 0 ? 0 : Math.max(-y, Math.min(y, pose.y)),
  };
}

// Points are relative to the viewport center. Keep the image pixel under the
// initial fingers anchored to their new midpoint while zooming and translating.
export function transformImagePose(
  pose: ImagePose,
  from: Point,
  to: Point,
  targetScale: number,
  view: Size,
  fitted: Size,
): ImagePose {
  const scale = Math.max(MIN_IMAGE_ZOOM, Math.min(MAX_IMAGE_ZOOM, targetScale));
  const ratio = scale / pose.scale;
  return constrainImagePose(
    {
      scale,
      x: to.x - (from.x - pose.x) * ratio,
      y: to.y - (from.y - pose.y) * ratio,
    },
    view,
    fitted,
  );
}
