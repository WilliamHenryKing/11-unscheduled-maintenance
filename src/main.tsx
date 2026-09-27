import { createRoot } from "react-dom/client";
import { unlockOnGesture } from "./audio/sound";
import { worldReady } from "./loader";
import { Stage } from "./scene/stage";
import { App } from "./ui/App";
import "./styles.css";

const root = document.getElementById("root");
if (root) {
  const canvas = document.createElement("canvas");
  canvas.className = "stage";
  canvas.setAttribute("aria-label", "Optical bench of the telescope");
  root.before(canvas);
  const stage = new Stage(canvas);
  stage.onFirstFrame = () => requestAnimationFrame(() => worldReady());
  createRoot(root).render(<App stage={stage} />);
  unlockOnGesture();
}
