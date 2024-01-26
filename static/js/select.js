let actionSelect = new SlimSelect({
    select: "#action",
    events: {
        beforeChange: (selected) => {
            changeHeader("action", selected[0].value);
        },
    },
});

let domainSelect = new SlimSelect({
    select: "#domain",
    settings: {
        allowDeselect: true,
        closeOnSelect: false,
        placeholderText: "Select domains",
    },
    events: {
        afterChange: (domains) => {
            const domainsList = domains.map((domain) => {
                return domain.value;
            });
            localStorage.setItem("domains", JSON.stringify(domainsList));
        },
    },
});

if (localStorage.getItem("domains")) {
    const domains = JSON.parse(localStorage.getItem("domains"));
    domainSelect.setSelected(domains);
}
