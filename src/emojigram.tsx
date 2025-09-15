import { PhotoIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
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
  const emojigramDataURL =
    emojigram &&
    `data:image/svg+xml,${encodeURIComponent(
      `<svg version="1.1" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        ${emojigram
          .map(
            (emoji) =>
              `<text
                x="${emoji.x}"
                y="${emoji.y}"
                dominant-baseline="central"
                text-anchor="middle"
                transform="rotate(${emoji.rotate})"
                font-size="${emoji.fontSize}"
                style="
                  text-shadow: -1px -1px #ffffff, 1px -1px #ffffff, -1px 1px #ffffff, 1px 1px #ffffff;
                "
              >
                ${emoji.text}
              </text>`,
          )
          .join("")}
      </svg>`,
    )}`;

  const [description, setDescription] = useState("");
  const [imageDataURL, setImageDataURL] = useState<string>();

  const [generating, setGenerating] = useState(false);

  const descriptionTextareaID = useId();
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const abortController = new AbortController();
    (async () => {
      setGenerating(true);
      try {
        // debounce
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (abortController.signal.aborted) {
          throw abortController.signal.reason;
        }
        const response = await fetch(
          "https://generate-98542956806.us-central1.run.app",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description, image: imageDataURL }),
          },
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch emojigram: ${response.status} ${response.statusText}`,
          );
        }
        const { emojigram } = await response.json();

        if (abortController.signal.aborted) {
          throw abortController.signal.reason;
        }
        setEmojigram(emojigram);
        console.log(emojigram);
      } finally {
        if (!abortController.signal.aborted) {
          setGenerating(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [description, imageDataURL]);

  const handleImageButtonClick = () => {
    const imageInput = imageInputRef.current;
    if (!imageInput) {
      throw new Error("Image input is not available");
    }

    imageInput.click();
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
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

    setImageDataURL(canvas.toDataURL("image/jpeg"));
    setDescription("");
    setEmojigram(undefined);
  };

  const handleDescriptionTextareaChange: ChangeEventHandler<
    HTMLTextAreaElement
  > = (event) => {
    setDescription(event.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-y-4">
        <button
          type="button"
          onClick={handleImageButtonClick}
          className="relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg border border-transparent bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PhotoIcon className="size-6 shrink-0" aria-hidden="true" />
          写真を選択
        </button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      <div
        className={clsx(
          "flex min-h-[200px] items-center justify-center rounded-lg border p-[2px]",
          generating
            ? "border-transparent [background-size:300%]"
            : "border-zinc-950/10 bg-zinc-50",
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
          {emojigramDataURL ? (
            <img src={emojigramDataURL} alt="生成されたEmojigram" />
          ) : (
            <p className="text-center text-base/6 text-zinc-500 sm:text-sm/6">
              {generating
                ? "Emojigramを生成しています……"
                : "写真を選択すると、Emojigramの生成結果がここに表示されます"}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor={descriptionTextareaID}
          className="block text-sm/6 font-medium text-gray-900"
        >
          どんな絵文字にしたい?
        </label>

        <textarea
          id={descriptionTextareaID}
          rows={4}
          value={description}
          onChange={handleDescriptionTextareaChange}
          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 sm:text-sm/6"
        />
      </div>
    </div>
  );
};
