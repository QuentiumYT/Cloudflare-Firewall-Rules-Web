const currentFile = document.getElementById("current-file");
const currentState = document.getElementById("current-state");

const updateInfos = (name, state) => {
    currentFile.innerText = name;
    currentState.innerText = "(" + state + ")";
};

const pausedOption = document.getElementById("paused");
const priorityOption = document.getElementById("priority");

const changeHeader = (key, value) => {
    const codeValue = cfeditor.getValue();
    const lines = codeValue.split(/\r?\n/g);
    const firstLine = lines[0];
    const header = parseHeader(firstLine);

    if (header !== null) {
        header[key] = value;
        let newHeader = generateHeader(header);
        // Fix when header is created and number of real lines is 1
        if (lines.length <= 3) {
            newHeader = newHeader + "\n";
        }
        cfeditor.setValue(newHeader + codeValue.substring(firstLine.length + 1));
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

const parseHeader = (headerLine) => {
    if (headerLine.startsWith("#!") && headerLine.endsWith("!#")) {
        headerLine = headerLine.substring(2);
        headerLine = headerLine.substring(0, headerLine.length - 2);

        let header = headerLine.split(" ").reduce((obj, item) => {
            let [key, value] = item.split(":");
            if (value !== undefined) {
                obj[key] = value;
            }
            return obj;
        }, {});
        return header;
    } else {
        return null;
    }
};

const askName = async () => {
    Swal.fire({
        title: "Create a new rule",
        text: "Enter a name for the rule",
        input: "text",
        inputAttributes: {
            autocapitalize: "off",
        },
        showCancelButton: true,
        confirmButtonText: "Save",
        showLoaderOnConfirm: true,
        preConfirm: (name) => {
            if (name.length > 3) {
                cfeditor.currentFile = name + ".txt";
                updateInfos(cfeditor.currentFile, cfeditor.currentState);
                setEditorState("edited");
                if (cfeditor.isCreated === undefined) {
                    cfeditor.isCreated = true;
                    createRule();
                } else {
                    saveRule();
                }
            } else {
                Swal.showValidationMessage("Rule name must be at least 4 characters long");
            }
        },
    });
};

const createRule = async () => {
    if (cfeditor.isCreated === true) {
        actionSelect.set("");
        pausedOption.checked = false;
        priorityOption.value = "";

        cfeditor.setValue("# enter your cloudflare rules here");
    } else {
        askName();
    }

    cfeditor.isCreated = undefined;
};

const loadRule = async (name) => {
    if (cfeditor.currentState === "edited") {
        let agreeSwitch = await Swal.fire({
            title: "Are you sure you want to switch?",
            text: "You have unsaved changes in the current rule, if you switch it will be lost forever :/",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
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
                actionSelect.set(header.action);
                pausedOption.checked = header.paused === "False";
                priorityOption.value = header.priority;
            } else {
                actionSelect.set("");
                pausedOption.checked = false;
                priorityOption.value = "";
            }
        });

    cfeditor.isDeleted = false;

    setEditorState("unloaded");
};

const saveRule = async (silent = false) => {
    let name = cfeditor.currentFile;

    if (name === undefined && cfeditor.getValue() !== "") {
        askName();
        cfeditor.isCreated = true;
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
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
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
    if (name !== undefined && domainSelect.data.data.length > 0) {
        document.getElementById("rule").value = name;
        return true;
    }
    return false;
};

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveRule(cfeditor.currentFile);
    }
});

pausedOption.addEventListener("change", (e) => {
    changeHeader("paused", e.target.checked ? "False" : "True");
});

priorityOption.addEventListener("change", (e) => {
    changeHeader("priority", e.target.value);
});
