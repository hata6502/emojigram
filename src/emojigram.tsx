import { ArrowPathIcon, PhotoIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEventHandler, FunctionComponent } from "react";
import { z } from "zod";

export const Emojigram: FunctionComponent = () => {
  const [caption, setCaption] = useState("");
  const [emojigramDataURL, setEmojigramDataURL] = useState("");
  const [generating, setGenerating] = useState(false);

  const [description, setDescription] = useState("");
  const [imageDataURL, setImageDataURL] = useState<string>();
  const [regenerateCount, setRegenerateCount] = useState(0);

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
        const { caption, emojigram } = z
          .object({
            caption: z.string(),
            emojigram: z.array(
              z.object({
                x: z.number(),
                y: z.number(),
                text: z.string(),
                fontSize: z.number(),
                rotate: z.number(),
                horizontalFlip: z.boolean(),
                verticalFlip: z.boolean(),
              }),
            ),
          })
          .parse(await response.json());

        const svg = `<svg version="1.1" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
          ${emojigram
            .map(
              (emoji) =>
                `<text
                  x="${emoji.x}"
                  y="${emoji.y}"
                  dominant-baseline="middle"
                  text-anchor="middle"
                  transform="rotate(${emoji.rotate}) scale(${emoji.horizontalFlip ? -1 : 1}, ${emoji.verticalFlip ? -1 : 1})"
                  transform-origin="${emoji.x} ${emoji.y}"
                  font-size="${emoji.fontSize}"
                  style="
                    text-shadow: -1px -1px #ffffff, 1px -1px #ffffff, -1px 1px #ffffff, 1px 1px #ffffff;
                  "
                >
                  ${emoji.text}
                </text>`,
            )
            .join("")}
        </svg>`;

        const svgImage = new Image();
        svgImage.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        await svgImage.decode();
        const canvas = document.createElement("canvas");
        canvas.width = svgImage.naturalWidth * 2;
        canvas.height = svgImage.naturalHeight * 2;
        const canvasContext = canvas.getContext("2d");
        if (!canvasContext) {
          throw new Error("Canvas context is not available");
        }
        canvasContext.drawImage(svgImage, 0, 0, canvas.width, canvas.height);
        const pngDataURL = canvas.toDataURL("image/png");

        if (abortController.signal.aborted) {
          throw abortController.signal.reason;
        }
        setCaption(caption);
        setEmojigramDataURL(pngDataURL);
        console.log(emojigram);
        console.log(svg);
        console.log(caption);
      } finally {
        if (!abortController.signal.aborted) {
          setGenerating(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [description, imageDataURL, regenerateCount]);

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

    setCaption("");
    setEmojigramDataURL("");
    setDescription("");
    setImageDataURL(canvas.toDataURL("image/jpeg"));
  };

  const handleDescriptionTextareaChange: ChangeEventHandler<
    HTMLTextAreaElement
  > = (event) => {
    setDescription(event.target.value);
  };

  const handleRegenerateButtonClick = () => {
    setRegenerateCount((regenerateCount) => regenerateCount + 1);
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
        <div className="flex min-h-[196px] w-full items-center justify-center rounded-md bg-zinc-50">
          {emojigramDataURL ? (
            <figure>
              <img
                src={emojigramDataURL}
                alt={caption}
                style={{ width: 512 }}
              />

              <figcaption className="text-center text-base/6 text-zinc-500 sm:text-sm/6">
                {caption}
              </figcaption>
            </figure>
          ) : (
            <p className="text-center text-base/6 text-zinc-500 sm:text-sm/6">
              Emojigramを生成しています……
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor={descriptionTextareaID}
            className="block text-sm/6 font-medium text-gray-900"
          >
            どんな絵文字にしたい?
          </label>

          <button
            type="button"
            disabled={generating}
            onClick={handleRegenerateButtonClick}
            className="relative inline-flex items-center justify-center rounded-md border border-transparent p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowPathIcon className="size-4 shrink-0" aria-hidden="true" />
          </button>
        </div>

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
