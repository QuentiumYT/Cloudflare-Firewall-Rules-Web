let actionSelect = new SlimSelect({
    select: "#action",
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
