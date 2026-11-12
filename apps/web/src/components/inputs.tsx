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
        "min-h-11 w-full resize-none overflow-hidden rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60",
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

const INPUT_STYLES =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 sm:text-sm";

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      className={twMerge(INPUT_STYLES, className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={twMerge(INPUT_STYLES, "cursor-pointer", className)}
      {...props}
    />
  );
}

export function FormField({
  htmlFor,
  label,
  hint,
  children,
  className,
}: React.PropsWithChildren<{
  htmlFor: string;
  label: string;
  hint?: string;
  className?: string;
}>) {
  return (
    <div
      className={twMerge(
        "flex min-w-0 flex-col gap-2 text-sm font-medium text-slate-700",
        className,
      )}
    >
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && (
        <span className="text-xs leading-relaxed font-normal text-slate-500">
          {hint}
        </span>
      )}
    </div>
  );
}

const BUTTON_STYLES =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS = {
  primary: "bg-slate-900 text-white hover:bg-slate-700",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  outline: "border border-gray-300 hover:bg-gray-50",
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
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

export function IconButton({
  className,
  ...props
}: ButtonProps & { "aria-label": string }) {
  return (
    <Button
      variant="ghost"
      className={twMerge("size-11 shrink-0 p-2.5", className)}
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
