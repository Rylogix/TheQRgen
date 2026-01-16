(() => {
  const input = document.getElementById("qr-input");
  const generateBtn = document.getElementById("generate-btn");
  const downloadBtn = document.getElementById("download-btn");
  const colorPicker = document.getElementById("color-picker");
  const section = document.getElementById("qr-section");
  const canvas = document.getElementById("qr-canvas");

  const OUTPUT_SIZE = 1200;
  const ERROR_CORRECTION = "M";
  const DEFAULT_BACKGROUND = "#fff";
  const DARK_COLOR = "#000";
  const BORDER_PX = 2;
  const BORDER_MODULES = 1;
  let lastText = "";

  const drawQr = (text, backgroundColor) => {
    const qr = qrcode(0, ERROR_CORRECTION);
    qr.addData(text);
    qr.make();

    const count = qr.getModuleCount();
    const ctx = canvas.getContext("2d", { alpha: false });
    const totalModules = count + BORDER_MODULES * 2;
    const cellSize = Math.floor(OUTPUT_SIZE / totalModules);
    const qrSize = cellSize * count;
    const totalSize = cellSize * totalModules;
    const offset = Math.floor((OUTPUT_SIZE - totalSize) / 2) + cellSize * BORDER_MODULES;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.fillStyle = DARK_COLOR;

    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(
            offset + col * cellSize,
            offset + row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    const halfBorder = BORDER_PX / 2;
    ctx.strokeStyle = DEFAULT_BACKGROUND;
    ctx.lineWidth = BORDER_PX;
    ctx.strokeRect(
      halfBorder,
      halfBorder,
      OUTPUT_SIZE - BORDER_PX,
      OUTPUT_SIZE - BORDER_PX
    );
  };

  const setOutputVisible = (visible) => {
    section.hidden = !visible;
    if (visible) {
      section.classList.remove("is-visible");
      requestAnimationFrame(() => {
        section.classList.add("is-visible");
      });
    } else {
      section.classList.remove("is-visible");
    }
  };

  const generateQr = () => {
    const rawText = input.value;
    if (!rawText.trim()) {
      lastText = "";
      setOutputVisible(false);
      return;
    }

    lastText = rawText;
    drawQr(rawText, colorPicker.value || DEFAULT_BACKGROUND);
    setOutputVisible(true);
  };

  const downloadQr = () => {
    if (section.hidden) {
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "qr-code.png";
    link.click();
  };

  generateBtn.addEventListener("click", generateQr);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      generateQr();
    }
  });
  colorPicker.addEventListener("input", () => {
    if (!lastText || section.hidden) {
      return;
    }
    drawQr(lastText, colorPicker.value || DEFAULT_BACKGROUND);
  });
  downloadBtn.addEventListener("click", downloadQr);
})();
