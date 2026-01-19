(() => {
  const app = document.querySelector(".app");
  const modeButtons = document.querySelectorAll("[data-mode]");
  const input = document.getElementById("qr-input");
  const generateBtn = document.getElementById("generate-btn");
  const downloadBtn = document.getElementById("download-btn");
  const colorPicker = document.getElementById("color-picker");
  const logoInput = document.getElementById("logo-input");
  const logoStatus = document.getElementById("logo-status");
  const logoRemoveBtn = document.getElementById("logo-remove-btn");
  const outputStatus = document.getElementById("output-status");
  const section = document.getElementById("qr-section");
  const canvas = document.getElementById("qr-canvas");

  const OUTPUT_SIZE = 1200;
  const BARCODE_WIDTH = 1200;
  const BARCODE_HEIGHT = 600;
  const BARCODE_LINE_HEIGHT = 360;
  const BARCODE_MARGIN = 48;
  const ERROR_CORRECTION = "H";
  const DEFAULT_BACKGROUND = "#fff";
  const DARK_COLOR = "#000";
  const BORDER_MODULES = 1;
  const LOGO_SCALE = 0.18;
  const LOGO_PADDING = 0.18;
  const MODES = {
    QR: "qr",
    BARCODE: "barcode",
  };
  let lastText = "";
  let logoImage = null;
  let currentMode = MODES.QR;

  logoRemoveBtn.disabled = true;

  const setStatus = (message) => {
    outputStatus.textContent = message;
    outputStatus.hidden = !message;
  };

  const clearLogo = () => {
    logoImage = null;
    logoInput.value = "";
    logoStatus.textContent = "";
    logoRemoveBtn.disabled = true;
    if (currentMode === MODES.QR && lastText && !section.hidden) {
      drawQr(lastText, colorPicker.value || DEFAULT_BACKGROUND);
    }
  };

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
    if (logoImage) {
      let logoModules = Math.max(
        1,
        Math.round((qrSize * LOGO_SCALE) / cellSize)
      );
      let paddingModules = Math.max(1, Math.round(logoModules * LOGO_PADDING));
      let bgModules = logoModules + paddingModules * 2;

      if (bgModules > count) {
        bgModules = count;
        logoModules = Math.max(1, count - paddingModules * 2);
        if (logoModules < 1) {
          logoModules = Math.max(1, Math.floor(count * 0.6));
          paddingModules = Math.max(0, Math.floor((count - logoModules) / 2));
        }
      }

      const startModule = Math.floor((count - bgModules) / 2);
      const bgX = offset + startModule * cellSize;
      const bgY = offset + startModule * cellSize;
      const bgSize = bgModules * cellSize;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(bgX, bgY, bgSize, bgSize);

      const logoX = bgX + paddingModules * cellSize;
      const logoY = bgY + paddingModules * cellSize;
      const logoSize = logoModules * cellSize;

      const ratio = Math.min(
        logoSize / logoImage.width,
        logoSize / logoImage.height
      );
      const drawWidth = Math.floor(logoImage.width * ratio);
      const drawHeight = Math.floor(logoImage.height * ratio);
      const drawX = Math.floor(logoX + (logoSize - drawWidth) / 2);
      const drawY = Math.floor(logoY + (logoSize - drawHeight) / 2);
      ctx.drawImage(logoImage, drawX, drawY, drawWidth, drawHeight);
    }
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

  const drawBarcode = (text) => {
    const ctx = canvas.getContext("2d", { alpha: false });
    canvas.width = BARCODE_WIDTH;
    canvas.height = BARCODE_HEIGHT;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = DEFAULT_BACKGROUND;
    ctx.fillRect(0, 0, BARCODE_WIDTH, BARCODE_HEIGHT);

    try {
      JsBarcode(canvas, text, {
        format: "CODE128",
        displayValue: false,
        margin: BARCODE_MARGIN,
        background: DEFAULT_BACKGROUND,
        lineColor: DARK_COLOR,
        width: 2,
        height: BARCODE_LINE_HEIGHT,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const renderOutput = () => {
    if (!lastText.trim()) {
      setOutputVisible(false);
      return;
    }

    if (currentMode === MODES.QR) {
      drawQr(lastText, colorPicker.value || DEFAULT_BACKGROUND);
      setOutputVisible(true);
      setStatus("");
      return;
    }

    if (!drawBarcode(lastText)) {
      setOutputVisible(false);
      setStatus("Barcode input not supported. Try a different value.");
      return;
    }

    setOutputVisible(true);
    setStatus("");
  };

  const generateOutput = () => {
    const rawText = input.value;
    if (!rawText.trim()) {
      lastText = "";
      setOutputVisible(false);
      setStatus("");
      return;
    }

    lastText = rawText;
    renderOutput();
  };

  const downloadOutput = () => {
    if (section.hidden) {
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = currentMode === MODES.QR ? "qr-code.png" : "barcode.png";
    link.click();
  };

  const setMode = (mode) => {
    currentMode = mode;
    const isBarcode = mode === MODES.BARCODE;

    app.classList.toggle("is-barcode", isBarcode);
    modeButtons.forEach((button) => {
      const isActive = button.dataset.mode === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    input.placeholder = isBarcode
      ? " Enter text or numbers for barcode.."
      : " Type anything here..";
    input.setAttribute(
      "aria-label",
      isBarcode ? "Barcode content" : "QR content"
    );
    generateBtn.textContent = isBarcode ? "Generate Barcode" : "Generate QR Code";

    colorPicker.disabled = isBarcode;
    logoInput.disabled = isBarcode;
    logoRemoveBtn.disabled = isBarcode || !logoImage;

    if (isBarcode) {
      clearLogo();
    }

    if (lastText) {
      renderOutput();
    } else {
      setOutputVisible(false);
    }
  };

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextMode = button.dataset.mode;
      if (nextMode && nextMode !== currentMode) {
        setMode(nextMode);
      }
    });
  });

  generateBtn.addEventListener("click", generateOutput);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      generateOutput();
    }
  });
  colorPicker.addEventListener("input", () => {
    if (currentMode !== MODES.QR || !lastText || section.hidden) {
      return;
    }
    drawQr(lastText, colorPicker.value || DEFAULT_BACKGROUND);
  });
  logoInput.addEventListener("change", () => {
    const file = logoInput.files && logoInput.files[0];
    if (!file) {
      clearLogo();
      return;
    }

    if (!file.type || !file.type.startsWith("image/")) {
      clearLogo();
      logoStatus.textContent = "Please choose an image file.";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        logoImage = img;
        logoRemoveBtn.disabled = false;
        if (lastText && !section.hidden) {
          drawQr(lastText, colorPicker.value || DEFAULT_BACKGROUND);
        }
      };
      img.onerror = () => {
        clearLogo();
        logoStatus.textContent = "Image failed to load.";
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  logoRemoveBtn.addEventListener("click", () => {
    clearLogo();
  });
  downloadBtn.addEventListener("click", downloadOutput);

  setStatus("");
  setMode(MODES.QR);
})();
