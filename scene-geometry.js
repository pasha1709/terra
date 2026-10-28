// Project original-image percentages through CSS object-fit: cover and object-position.
export function projectHotspot({ imageWidth, imageHeight, frameWidth, frameHeight, point, position }) {
  if (![imageWidth, imageHeight, frameWidth, frameHeight].every((v) => Number.isFinite(v) && v > 0)) return null;
  const scale = Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const x = (width * point.x / 100 + (frameWidth - width) * position.x / 100) / frameWidth * 100;
  const y = (height * point.y / 100 + (frameHeight - height) * position.y / 100) / frameHeight * 100;
  return { x, y, visible: x >= 0 && x <= 100 && y >= 0 && y <= 100 };
}
