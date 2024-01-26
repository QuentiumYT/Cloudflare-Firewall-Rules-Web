const currentFile = document.getElementById("current-file");
const currentState = document.getElementById("current-state");

const updateInfos = (name, state) => {
    currentFile.innerText = name;
    currentState.innerText = "(" + state + ")";
};

const enabledOption = document.getElementById("enabled");

const changeHeader = (key, value) => {
    const codeValue = cfeditor.getValue();
    const lines = codeValue.split(/\r?\n/g);
    const firstLine = lines[0];
    const header = parseHeader(firstLine);

    if (header !== null) {
        let updatedHeader = { ...header };
        updatedHeader[key] = value;
        cfeditor.setValue(generateHeader(updatedHeader) + "\n" + codeValue.substring(firstLine.length + 1));
    } else {
        let newHeader = {};
        newHeader[key] = value;
        cfeditor.setValue(generateHeader(newHeader) + "\n" + codeValue);
    }
    cfeditor.currentState = "edited";
};

const generateHeader = (obj) => {
    let header = " ";
    for (let key in obj) {
        header += key + ":" + obj[key] + " ";
    }
    return "#!" + header + "!#";
};

const parseHeader = (line) => {
    if (line.startsWith("#!") && line.endsWith("!#")) {
        const headerLine = line.substring(2, line.length - 2);

        return headerLine.split(" ").reduce((obj, item) => {
            let [key, value] = item.split(":");
            if (value !== undefined) {
                obj[key] = value;
            }
            return obj;
        }, {});
    } else {
        return null;
    }
};

const askName = async () => {
    return Swal.fire({
        title: "Create a new rule",
        text: "Enter a name for the rule",
        input: "text",
        inputAttributes: {
            autocapitalize: "off",
        },
        confirmButtonColor: "#0051c3",
        confirmButtonText: "Save",
        showLoaderOnConfirm: true,
        preConfirm: (name) => {
            if (name.length > 3) {
                cfeditor.currentFile = name + ".txt";
                updateInfos(cfeditor.currentFile, cfeditor.currentState);
                setEditorState("edited");
            } else {
                Swal.showValidationMessage("Rule name must be at least 4 characters long");
            }
        },
    });
};

const createRule = async () => {
    if (cfeditor.getValue() !== "") {
        await askName().then((result) => {
            if (result.value) {
                saveRule(true);
                document.getElementById("rules").innerHTML += `
                    <li class="text-white text-sm bg-secondary p-2 rounded-md cursor-pointer">
                        <a class="block" onclick="loadRule('${result.value}.txt')">${result.value}</a>
                    </li>
                `;
            }
        });
    }
};

const loadRule = async (name) => {
    if (cfeditor.currentState === "edited") {
        let agreeSwitch = await Swal.fire({
            title: "Are you sure you want to switch?",
            text: "You have unsaved changes in the current rule, if you switch it will be lost forever :/",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#0051c3",
            cancelButtonColor: "#e3342f",
            confirmButtonText: "Yes, switch to it!",
        }).then((result) => {
            return result.isConfirmed;
        });

        if (!agreeSwitch) {
            return;
        }
    }

    fetch("/get-file/" + name)
        .then((response) => response.text())
        .then((text) => {
            cfeditor.currentFile = name;
            cfeditor.setValue(text);

            let header = parseHeader(text.split(/\r?\n/g)[0]);

            if (header !== null) {
                actionSelect.setSelected(header.action);
                enabledOption.checked = header.enabled ? header.enabled === "True" : true;
            } else {
                actionSelect.setSelected("");
                enabledOption.checked = true;
            }
        });

    cfeditor.isDeleted = false;

    setEditorState("unloaded");
};

const saveRule = async (silent = false) => {
    let name = cfeditor.currentFile;

    if (name === undefined) {
        createRule();
    }

    if (cfeditor.currentState === "loaded" && cfeditor.getValue() !== "") {
        if (silent === false) {
            Swal.fire({
                title: "No modifications",
                text: "Nothing has changed in the file",
                icon: "info",
                timer: 800,
            });
        }
    } else if (name !== undefined && cfeditor.getValue() !== "") {
        fetch("/save-file/" + name, {
            method: "POST",
            body: cfeditor.getValue(),
        })
            .then((response) => response.json())
            .then((data) => {
                if (silent === false) {
                    Swal.fire({
                        title: "Saved",
                        text: "Rule saved successfully",
                        icon: "success",
                        timer: 800,
                    });
                }

                cfeditor.isDeleted = false;

                setEditorState("loaded");
            })
            .catch((error) => {
                Swal.fire({
                    title: "Error",
                    text: "Error saving rule: " + error,
                    icon: "error",
                });
            });
    }
};

const downloadRule = async () => {
    let name = cfeditor.currentFile;

    if (cfeditor.isDeleted === true) {
        name = "(deleted) " + name;
    }

    if (name !== undefined && cfeditor.getValue() !== "") {
        let content = cfeditor.getValue();

        let element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
        element.setAttribute("download", name);

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
};

const deleteRule = async () => {
    let name = cfeditor.currentFile;

    if (name !== undefined && cfeditor.isDeleted !== true) {
        let agreeDelete = await Swal.fire({
            title: "Are you sure to delete this rule?",
            text: "You can save it back if you stay on the page, else it will be deleted forever :/",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#0051c3",
            cancelButtonColor: "#e3342f",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            return result.isConfirmed;
        });

        if (!agreeDelete) {
            return;
        }

        fetch("/delete-file/" + name, {
            method: "DELETE",
        })
            .then((response) => response.json())
            .then((data) => {
                Swal.fire({
                    title: "Deleted",
                    text: "Rule deleted successfully",
                    icon: "success",
                    timer: 800,
                });

                cfeditor.isDeleted = true;

                setEditorState("unloaded");
            })
            .catch((error) => {
                Swal.fire({
                    title: "Error",
                    text: "Error deleting rule: " + error,
                    icon: "error",
                });
            });
    } else if (cfeditor.isDeleted === true) {
        Swal.fire({
            title: "Warning",
            text: "Rule is already deleted",
            icon: "warning",
        });
    }
};

const sendRule = () => {
    saveRule(true);
    const name = cfeditor.currentFile;
    if (name !== undefined && domainSelect.getSelected().length > 0) {
        document.getElementById("rule").value = name;
        return true;
    }
    return false;
};

const importRule = async () => {
    fetch("/list-domains")
        .then((response) => response.json())
        .then((data) => {
            if (!data.domains) {
                return Swal.fire({
                    title: "Error",
                    html:
                        "Error getting domains: " + data.error +
                        "<br><br>" +
                        "Please login to list your domains <a href='/profile' class='text-secondary'>here</a>.",
                    icon: "error",
                });
            }

            const domains = Object.fromEntries(
                data.domains.map((domain) => [domain.name, domain.name])
            );

            Swal.fire({
                title: "Domains",
                text: "Select a domain to list its rules",
                input: "select",
                inputOptions: domains,
                inputPlaceholder: "Select a domain",
                confirmButtonColor: "#0051c3",
                showLoaderOnConfirm: true,
                backdrop: true,
                preConfirm: async (domain) => {
                    const response = await fetch("/list-rules/" + domain);
                    const data = await response.json();
                    data.domain = domain;
                    return data;
                },
                inputValidator: (value) => {
                    if (!value) {
                        return "You need to select a domain";
                    }
                },
                allowOutsideClick: () => !Swal.isLoading(),
            })
                .then((result) => {
                    if (result.isConfirmed) {
                        const { domain } = result.value;
                        const rules = Object.fromEntries(
                            result.value.rules.map((rule) => [rule.description, rule.description])
                        );

                        Swal.fire({
                            title: domain + "'s rules",
                            text: "Select a rule to import",
                            input: "select",
                            inputOptions: rules,
                            inputPlaceholder: "Select a rule",
                            confirmButtonColor: "#0051c3",
                            showLoaderOnConfirm: true,
                            backdrop: true,
                            preConfirm: async (rule) => {
                                let formData = new FormData();
                                formData.append("domain", domain);
                                formData.append("rule", rule);

                                const response = await fetch("/import-rule", {
                                    method: "POST",
                                    body: formData,
                                });
                                const data = await response.json();
                                return data.rule;
                            },
                            inputValidator: (value) => {
                                if (!value) {
                                    return "You need to select a rule";
                                }
                            },
                            allowOutsideClick: () => !Swal.isLoading(),
                        })
                            .then((result) => {
                                if (result.isConfirmed) {
                                    loadRule(result.value.rule + ".txt");
                                    document.getElementById("rules").innerHTML += `
                                        <li class="text-white text-sm bg-secondary p-2 rounded-md cursor-pointer">
                                            <a class="block" onclick="loadRule('${result.value.rule}.txt')">${result.value.rule}</a>
                                        </li>
                                    `;
                                }
                            });
                    }
                });
        });
};

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveRule(true);
    }
});

enabledOption.addEventListener("change", (e) => {
    changeHeader("enabled", e.target.checked ? "True" : "False");
});
