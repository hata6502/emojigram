import { CameraIcon, PhotoIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useRef, useState } from "react";
import type { ChangeEventHandler, FunctionComponent } from "react";

export const Emojigram: FunctionComponent = () => {
  const [emojigram, setEmojigram] = useState<
    {
      x: number;
      y: number;
      text: string;
      fontSize: number;
      rotate: number;
    }[]
  >();
  const [generating, setGenerating] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleCameraButton = () => {
    if (!cameraInputRef.current) {
      throw new Error("Camera input ref is not set");
    }

    cameraInputRef.current.click();
  };

  const handleGalleryButton = () => {
    if (!galleryInputRef.current) {
      throw new Error("Gallery input ref is not set");
    }

    galleryInputRef.current.click();
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    setGenerating(true);
    try {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const image = new Image();
      image.src = URL.createObjectURL(file);
      await image.decode();

      // 解像度やimage orientationを補正する
      const canvas = document.createElement("canvas");
      const zoom = Math.min(
        Math.min(image.naturalWidth, 1920) / image.naturalWidth,
        Math.min(image.naturalHeight, 1920) / image.naturalHeight,
      );
      canvas.width = image.naturalWidth * zoom;
      canvas.height = image.naturalHeight * zoom;
      const canvasContext = canvas.getContext("2d");
      if (!canvasContext) {
        throw new Error("Canvas context is not available");
      }
      canvasContext.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL("image/jpeg");

      const response = await fetch(
        "https://generate-98542956806.us-central1.run.app",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: "",
            image: dataURL,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch emojigram: ${response.status} ${response.statusText}`,
        );
      }
      const { emojigram } = await response.json();

      setEmojigram(emojigram);
      console.log(emojigram);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-y-4">
        <button
          type="button"
          onClick={handleCameraButton}
          className="relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg border border-transparent bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CameraIcon className="size-6 shrink-0" aria-hidden="true" />
          カメラで撮る
        </button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="flex items-center gap-x-4">
          <div className="h-px w-16 bg-zinc-300"></div>
          <span className="text-sm font-medium text-zinc-500">または</span>
          <div className="h-px w-16 bg-zinc-300"></div>
        </div>

        <button
          type="button"
          onClick={handleGalleryButton}
          className="relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-base font-semibold text-zinc-900 shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          <PhotoIcon className="size-5 shrink-0" aria-hidden="true" />
          写真を選択
        </button>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      <div
        className={clsx(
          "flex min-h-[200px] items-center justify-center rounded-lg p-[2px]",
          generating
            ? "border border-transparent [background-size:300%]"
            : "border border-zinc-950/10 bg-zinc-50",
        )}
        style={
          generating
            ? {
                backgroundImage:
                  "linear-gradient(45deg, #fde68a, #86efac, #7dd3fc, #93c5fd, #c4b5fd, #f9a8d4, #fde68a)",
                animation: "gradient-spin 3s linear infinite",
              }
            : {}
        }
      >
        <div className="flex min-h-[196px] w-full items-center justify-center rounded-md bg-zinc-50 p-4">
          {emojigram ? (
            <svg width={512} height={512} viewBox="0 0 512 512">
              {emojigram.map((emoji, index) => (
                <text
                  key={index}
                  x={emoji.x}
                  y={emoji.y}
                  dominantBaseline="central"
                  textAnchor="middle"
                  transform={`rotate(${emoji.rotate})`}
                  fontSize={emoji.fontSize}
                >
                  {emoji.text}
                </text>
              ))}
            </svg>
          ) : (
            <p className="text-center text-base/6 text-zinc-500 sm:text-sm/6">
              {generating
                ? "Emojigramを生成しています……"
                : "写真を選択すると、Emojigramの生成結果がここに表示されます"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
