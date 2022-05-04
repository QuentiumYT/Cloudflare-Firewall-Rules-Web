const setRuleContent = (name) => {
    let saveBtn = document.getElementById("save");
    saveBtn.setAttribute("onclick", "saveRule('" + name + "')");

    fetch("/get-file/" + name)
        .then((response) => response.text())
        .then((text) => {
            cfeditor.currentFile = name;
            cfeditor.setValue(text);
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
