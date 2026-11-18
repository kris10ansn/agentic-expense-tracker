// Keep React and the application stylesheet behind this async boundary so the
// prerendered screen can paint while the application downloads.
void import("./main").catch(() => {
  const screen = document.getElementById("startup-screen");
  const template = document.getElementById("startup-error");
  if (!screen || !(template instanceof HTMLTemplateElement)) {
    return;
  }

  screen.replaceChildren(template.content.cloneNode(true));
  screen.querySelector("button")?.addEventListener("click", () => {
    window.location.reload();
  });
});
