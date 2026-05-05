import type { JobApplicationQaItem } from "@/lib/types";

/**
 * Build a self-contained JS snippet that fills form fields on the apply
 * page. The snippet inlines the listing's Q&A as JSON so it works without
 * any cross-origin fetch.
 *
 * What it handles:
 *   - text / email / tel / url / number inputs (by `name` attribute)
 *   - textareas
 *   - native <select> (and Greenhouse's hidden underlying select for Select2)
 * What it can't:
 *   - file uploads (browser security) — logs the local path
 *   - fully custom React Select / Combobox widgets — logs the value to pick
 */
export function buildAutofillScript(
  qa: JobApplicationQaItem[],
  meta: { title: string; company: string }
): string {
  // Reduce to a payload of { name -> {value, type, required, options[]} }.
  const payload: Record<
    string,
    {
      value: string | null;
      type: string | null;
      group: string | null;
      required: boolean;
      label: string;
      options: { value: string; label: string }[] | null;
    }
  > = {};

  for (const item of qa) {
    if (!item.field_name) continue;
    payload[item.field_name] = {
      value: item.answer,
      type: item.field_type ?? null,
      group: item.field_group ?? null,
      required: !!item.required,
      label: item.question,
      options: item.values ?? null,
    };
  }

  const inlined = JSON.stringify(payload).replace(/<\/script>/gi, "<\\/script>");

  // The runtime side. Inlined as a string so the user pastes one self-contained
  // expression. Designed to work on Greenhouse / Lever / generic ATS pages.
  return `(function(){
  var DATA = ${inlined};
  var META = ${JSON.stringify(meta)};
  var filled = [], skipped = [], manualSelect = [], manualFile = [];

  function setNativeValue(el, value) {
    var proto = Object.getPrototypeOf(el);
    var setter = Object.getOwnPropertyDescriptor(proto, "value");
    if (setter && setter.set) {
      setter.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function findEl(name) {
    return document.querySelector('[name="' + name + '"]')
      || document.querySelector('[name="' + name + '[]"]')
      || document.getElementById(name);
  }

  Object.keys(DATA).forEach(function(name){
    var spec = DATA[name];
    if (spec.value == null || spec.value === "") {
      skipped.push({ field: name, reason: "no answer" });
      return;
    }
    var el = findEl(name);
    if (!el) {
      skipped.push({ field: name, reason: "element not found" });
      return;
    }
    var tag = (el.tagName || "").toLowerCase();
    var inputType = (el.getAttribute("type") || "").toLowerCase();

    // File inputs: can't automate
    if (tag === "input" && inputType === "file") {
      manualFile.push({ field: name, label: spec.label, hint: spec.value });
      return;
    }

    // Native select
    if (tag === "select") {
      var match = null;
      var options = el.options || [];
      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        if (opt.value === spec.value || (opt.text || "").toLowerCase().trim() === String(spec.value).toLowerCase().trim()) {
          match = opt;
          break;
        }
      }
      if (match) {
        el.value = match.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        filled.push({ field: name, label: spec.label, value: match.text });
      } else {
        manualSelect.push({ field: name, label: spec.label, target: spec.value });
      }
      return;
    }

    // Greenhouse multi_value_single_select renders a custom widget but exposes
    // a hidden <input type="hidden" name="..."> with the option ID. We can't
    // know the right ID without reading the page's option list, so we surface
    // it for the user.
    if (spec.type && spec.type.indexOf("select") !== -1) {
      manualSelect.push({ field: name, label: spec.label, target: spec.value, options: spec.options });
      return;
    }

    if (tag === "input" || tag === "textarea") {
      setNativeValue(el, String(spec.value));
      filled.push({ field: name, label: spec.label, value: String(spec.value).slice(0, 60) });
      return;
    }

    skipped.push({ field: name, reason: "unsupported tag: " + tag });
  });

  console.group("%c[jobs-autofill] " + META.title + " @ " + META.company, "color:#10b981;font-weight:bold");
  console.log("✓ Filled " + filled.length + " fields");
  filled.forEach(function(f){ console.log("  ✓", f.label, "→", f.value); });

  if (manualSelect.length) {
    console.warn("⚠ Manual select needed for " + manualSelect.length + " fields:");
    manualSelect.forEach(function(s){
      console.warn("  ⚠ " + s.label + " — pick: \\"" + s.target + "\\"");
    });
  }
  if (manualFile.length) {
    console.warn("⚠ File upload needed for " + manualFile.length + " field(s):");
    manualFile.forEach(function(f){
      console.warn("  ⚠ " + f.label + " — upload: " + f.hint);
    });
  }
  if (skipped.length) {
    console.info("ℹ Skipped " + skipped.length + " (no answer or no matching element):");
    skipped.forEach(function(s){
      console.info("  ℹ " + s.field + " — " + s.reason);
    });
  }
  console.groupEnd();

  return { filled: filled.length, manualSelect: manualSelect.length, manualFile: manualFile.length, skipped: skipped.length };
})();`;
}

/**
 * Wrap the autofill script as a single-line bookmarklet URL.
 * Bookmarklets must be a single javascript: URL with no line breaks.
 */
export function buildBookmarklet(script: string): string {
  // Collapse whitespace and encode.
  const compact = script.replace(/\s+/g, " ").trim();
  return `javascript:${encodeURIComponent(compact)}`;
}
