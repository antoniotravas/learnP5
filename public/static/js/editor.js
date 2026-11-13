// Editor de código: CodeMirror 5 (cores, chavetas automáticas) ou, se não carregar, uma textarea simples.

export function createEditor(parent, value, { onChange, onRun } = {}) {
  if (window.CodeMirror) {
    const cm = CodeMirror(parent, {
      value,
      mode: "javascript",
      lineNumbers: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      matchBrackets: true,
      autoCloseBrackets: true,
      lineWrapping: false,
      extraKeys: {
        "Ctrl-Enter": () => onRun?.(),
        "Cmd-Enter": () => onRun?.(),
        Tab: (cm) => (cm.somethingSelected() ? cm.indentSelection("add") : cm.replaceSelection("  ", "end")),
        "Shift-Tab": (cm) => cm.indentSelection("subtract"),
      },
    });
    cm.on("change", () => onChange?.(cm.getValue()));
    return {
      getValue: () => cm.getValue(),
      setValue: (v) => {
        cm.setValue(v);
        cm.clearHistory();
      },
      focus: () => cm.focus(),
      refresh: () => cm.refresh(),
      /** Marca a linha `n` (1, 2, ...) como tendo um erro; null limpa. */
      markError: (n) => {
        cm.eachLine((l) => cm.removeLineClass(l, "background", "cm-error-line"));
        if (n && n <= cm.lineCount()) cm.addLineClass(n - 1, "background", "cm-error-line");
      },
    };
  }
  const ta = document.createElement("textarea");
  ta.className = "code-fallback";
  ta.spellcheck = false;
  ta.value = value;
  ta.oninput = () => onChange?.(ta.value);
  ta.onkeydown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onRun?.();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      ta.setRangeText("  ", ta.selectionStart, ta.selectionEnd, "end");
      onChange?.(ta.value);
    }
  };
  parent.append(ta);
  return {
    getValue: () => ta.value,
    setValue: (v) => (ta.value = v),
    focus: () => ta.focus(),
    refresh: () => {},
    markError: () => {},
  };
}
