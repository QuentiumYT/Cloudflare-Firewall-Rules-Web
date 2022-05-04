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

const setRuleContent = (name) => {
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

    setEditorState("unloaded");
};

const saveRule = (name) => {
    if (cfeditor.currentState === "loaded") {
        Swal.fire({
            title: "No modifications",
            text: "Nothing has changed",
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
            })
            .catch((error) => {
                Swal.fire({
                    title: "Error",
                    text: "Error saving rule: " + error,
                    icon: "error",
                });
            });
    }
    setEditorState("loaded");
};

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveRule(cfeditor.currentFile);
    }
});
