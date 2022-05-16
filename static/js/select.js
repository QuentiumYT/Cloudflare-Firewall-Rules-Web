let actionSelect = new SlimSelect({
    select: "#action",
    beforeOnChange: (selected) => {
        changeHeader("action", selected.value);
    }
});

actionSelect.set("");

let domainSelect = new SlimSelect({
    select: "#domain",
    allowDeselectOption: true,
    closeOnSelect: false,
    deselectLabel: "✘",
    onChange: (domains) => {
        domains = domains.map((domain) => {
            return domain.value;
        });
        localStorage.setItem("domains", JSON.stringify(domains));
    }
});

if (localStorage.getItem("domains")) {
    const domains = JSON.parse(localStorage.getItem("domains"));
    domainSelect.set(domains);
}

document.addEventListener("DOMContentLoaded", () => {
    const select = domainSelect.slim.container.querySelector(".ss-multi-selected");
    let remove = document.createElement("span");
    remove.innerText = "🗑️";
    select.appendChild(remove);

    remove.addEventListener("click", () => {
        domainSelect.set([]);
    });
});
