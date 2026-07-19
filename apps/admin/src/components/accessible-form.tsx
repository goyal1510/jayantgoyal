"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
  type FormEventHandler,
  type ReactNode,
} from "react";

type ValidationError = {
  label: string;
  message: string;
};

type AccessibleFormProps = Omit<
  ComponentPropsWithoutRef<"form">,
  "onInvalid" | "onInput"
> & {
  children: ReactNode;
  onInvalid?: FormEventHandler<HTMLFormElement>;
  onInput?: FormEventHandler<HTMLFormElement>;
};

function isFormField(
  target: EventTarget | null,
): target is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

function fieldLabel(
  field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) {
  return (
    field.labels?.[0]?.textContent?.trim() ||
    field.getAttribute("aria-label") ||
    field.name ||
    field.id ||
    "This field"
  );
}

export function AccessibleForm({
  children,
  onInvalid,
  onInput,
  ...props
}: AccessibleFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const idPrefix = `validation-${useId().replace(/:/g, "")}`;
  const originalAttributes = useRef(
    new Map<string, { describedBy: string | null; invalid: string | null }>(),
  );
  const [errors, setErrors] = useState<Record<string, ValidationError>>({});

  function handleInvalid(event: FormEvent<HTMLFormElement>) {
    if (isFormField(event.target)) {
      const field = event.target;
      const key = field.id || field.name;

      if (key) {
        setErrors((current) => ({
          ...current,
          [key]: {
            label: fieldLabel(field),
            message: field.validationMessage,
          },
        }));
      }
    }

    onInvalid?.(event);
  }

  function handleInput(event: FormEvent<HTMLFormElement>) {
    if (isFormField(event.target)) {
      const field = event.target;
      const key = field.id || field.name;

      if (key && !field.validity.valid) {
        setErrors((current) => ({
          ...current,
          [key]: {
            label: fieldLabel(field),
            message: field.validationMessage,
          },
        }));
      } else if (key) {
        setErrors((current) => {
          if (!current[key]) return current;
          const next = { ...current };
          delete next[key];
          return next;
        });
      }
    }

    onInput?.(event);
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const findField = (key: string) =>
      Array.from(form.elements).find((element) =>
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
          ? element.id === key || element.name === key
          : false,
      );

    for (const [key, attributes] of originalAttributes.current) {
      if (errors[key]) continue;
      const field = findField(key);
      if (!field) continue;

      if (attributes.invalid === null) {
        field.removeAttribute("aria-invalid");
      } else {
        field.setAttribute("aria-invalid", attributes.invalid);
      }

      if (attributes.describedBy === null) {
        field.removeAttribute("aria-describedby");
      } else {
        field.setAttribute("aria-describedby", attributes.describedBy);
      }

      originalAttributes.current.delete(key);
    }

    for (const key of Object.keys(errors)) {
      const field = findField(key);
      if (!field) continue;

      if (!originalAttributes.current.has(key)) {
        originalAttributes.current.set(key, {
          describedBy: field.getAttribute("aria-describedby"),
          invalid: field.getAttribute("aria-invalid"),
        });
      }

      const originalDescribedBy =
        originalAttributes.current.get(key)?.describedBy ?? "";
      const describedBy = originalDescribedBy
        .split(/\s+/)
        .filter(Boolean)
        .filter((id) => !id.startsWith(`${idPrefix}-`));
      const errorId = `${idPrefix}-${key}-error`;

      field.setAttribute("aria-invalid", "true");
      field.setAttribute(
        "aria-describedby",
        [...describedBy, errorId].join(" "),
      );
    }
  }, [errors, idPrefix]);

  const errorEntries = Object.entries(errors);

  return (
    <form
      ref={formRef}
      {...props}
      onInvalidCapture={handleInvalid}
      onInputCapture={handleInput}
    >
      {children}
      {errorEntries.length > 0 ? (
        <div className="mt-3 space-y-1" role="alert" aria-live="assertive">
          <p className="text-sm font-medium text-destructive">
            Please review the highlighted fields before saving.
          </p>
          <ul className="sr-only">
            {errorEntries.map(([key, error]) => (
              <li key={key} id={`${idPrefix}-${key}-error`}>
                {error.label}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
