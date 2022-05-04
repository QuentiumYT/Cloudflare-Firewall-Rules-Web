const processHeader = (headerLine) => {
    if (headerLine.startsWith("#!") && headerLine.endsWith("!#")) {
        headerLine = headerLine.substring(2);
        headerLine = headerLine.substring(0, headerLine.length - 2);

        let header = headerLine.split(" ").reduce((obj, item) => {
            let [key, value] = item.split(":");
            obj[key] = value;
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
                saveRule();
            } else {
                Swal.showValidationMessage("Rule name must be at least 4 characters long");
            }
        },
    });

    setEditorState("edited");
};

const createRule = async () => {
    askName();

    actionSelect.set("");
    document.getElementById("paused").checked = false;
    document.getElementById("priority").value = "";

    cfeditor.setValue("# enter your cloudflare rules here");
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

            let header = processHeader(text.split("\n")[0]);

            if (header !== null) {
                actionSelect.set(header.action);
                document.getElementById("paused").checked = header.paused === "False";
                document.getElementById("priority").value = header.priority;
            } else {
                actionSelect.set("");
                document.getElementById("paused").checked = false;
                document.getElementById("priority").value = "";
            }
        });

    cfeditor.isDeleted = false;

    setEditorState("unloaded");
};

const saveRule = async () => {
    let name = cfeditor.currentFile;

    if (name === undefined && cfeditor.getValue() !== "") {
        askName();
    }

    if (cfeditor.currentState === "loaded" && cfeditor.getValue() !== "") {
        Swal.fire({
            title: "No modifications",
            text: "Nothing has changed in the file",
            icon: "info",
            timer: 800,
        });
    } else if (name !== undefined && cfeditor.getValue() !== "") {
        fetch("/save-file/" + name, {
            method: "POST",
            body: cfeditor.getValue(),
        })
            .then((response) => response.json())
            .then((data) => {
                Swal.fire({
                    title: "Saved",
                    text: "Rule saved successfully",
                    icon: "success",
                    timer: 800,
                });

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

const currentFile = document.getElementById("current-file");
const currentState = document.getElementById("current-state");

const updateInfos = (name, state) => {
    currentFile.innerText = name;
    currentState.innerText = "(" + state + ")";
};

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveRule(cfeditor.currentFile);
    }
});
