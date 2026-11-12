import type React from "react";
import {
  type ChangeEventHandler,
  type MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { twMerge } from "tailwind-merge";

export const TextArea = ({
  className,
  value,
  onChange,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  });

  return (
    <textarea
      ref={ref}
      rows={1}
      className={twMerge(
        "min-h-11 w-full resize-none overflow-hidden rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60",
        className,
      )}
      value={value}
      onChange={(e) => {
        const el = e.currentTarget;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;

        onChange?.(e);
      }}
      {...props}
    />
  );
};

export const TextInput = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type="text"
    className={twMerge(
      "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60",
      className,
    )}
    {...props}
  />
);

const BUTTON_STYLES =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  outline: "border border-gray-300 hover:bg-gray-50",
  ghost: "hover:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

type ButtonVariant = keyof typeof BUTTON_VARIANTS;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={twMerge(BUTTON_STYLES, BUTTON_VARIANTS[variant], className)}
      {...props}
    />
  );
}

type FileInputButtonProps = {
  fileList: File[];
  onChange: (fileList: FileList) => void;
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "ref" | "type" | "hidden" | "onClick" | "onChange"
  >;
} & Omit<ButtonProps, "onClick" | "onChange">;

export const FileInputButton = ({
  inputProps,
  children,
  fileList,
  onChange,
  ...props
}: FileInputButtonProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = useCallback<MouseEventHandler>(() => {
    inputRef.current?.click();
  }, []);

  const handleInputClick = useCallback<MouseEventHandler>((event) => {
    event.stopPropagation(); // Prevent double handleButtonClick
  }, []);

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      if (event.target.files === null) {
        throw new Error("Event target has no files!");
      }

      onChange(event.target.files);
    },
    [onChange],
  );

  useEffect(() => {
    if (inputRef.current) {
      const dataTransfer = new DataTransfer();
      fileList.forEach((file) => void dataTransfer.items.add(file));
      inputRef.current.files = dataTransfer.files;
    }
  }, [fileList]);

  return (
    <Button onClick={handleButtonClick} {...props}>
      <input
        ref={inputRef}
        type="file"
        hidden
        onClick={handleInputClick}
        onChange={handleChange}
        {...inputProps}
      />
      {children}
    </Button>
  );
};
