// scripts/transicoes.js

document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("loaded");
  
    document.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", function (e) {
        const url = this.href;
        const isSamePageHash = this.getAttribute("href")?.startsWith("#");
        const targetIsSamePage = url.split("#")[0] === window.location.href.split("#")[0];

        if (this.target === "_blank" || url.startsWith("http")) return;
        if (isSamePageHash || targetIsSamePage) return;
  
        e.preventDefault();
        document.body.classList.remove("loaded");
  
        setTimeout(() => {
          window.location.href = url;
        }, 250);
      });
    });
  });
  
