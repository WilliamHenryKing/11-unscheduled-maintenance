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
  canvas.tabIndex = 0;
  canvas.setAttribute("aria-label", "Optical bench of the telescope");
  root.before(canvas);
  const stage = new Stage(canvas);
  stage.onFirstFrame = () => requestAnimationFrame(() => worldReady());
  const app = createRoot(root);
  app.render(<App stage={stage} />);
  unlockOnGesture();
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      app.unmount();
      stage.dispose();
      canvas.remove();
    });
  }
}
