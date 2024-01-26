let cfeditor = window.cfeditor || {};

let setEditorState = function (state) {
    cfeditor.currentState = state;
    updateInfos(cfeditor.currentFile, cfeditor.currentState);
};

require.config({
    paths: {
        vs: "static/node_modules/monaco-editor/min/vs",
    },
});

require(["vs/editor/editor.main"], () => {
    monaco.languages.register({
        id: "cf-rule",
    });

    monaco.languages.setLanguageConfiguration("cf-rule", {
        surroundingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: "'", close: "'" },
            { open: '"', close: '"' },
        ],
        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: "'", close: "'", notIn: ["string", "comment"] },
            { open: '"', close: '"', notIn: ["string", "comment"] },
        ],
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
        ],
    });

    monaco.languages.setMonarchTokensProvider("cf-rule", {
        tokenizer: {
            root: [
                [/([0-9]{1,3}\.){3}([0-9]{1,3})\/[0-9]+/, "ip"],
                [/[\(|\)|\{|\}]/, "group"],
                [/"(.*?)"/, "string"],
                [/[0-9]+/, "number"],
                [/(not|and|xor|or)\b/, "logical"],
                [/(eq|ne|lt|le|gt|ge|contains|matches|in)\b/, "comparison"],
                [/^#.*/, "comment"],
            ],
        },
    });

    monaco.editor.defineTheme("cf-rule", {
        base: "vs",
        inherit: false,
        rules: [
            {
                token: "group",
                foreground: "#881337",
            },
            {
                token: "string",
                foreground: "#65a30d",
            },
            {
                token: "logical",
                foreground: "#0c4a6e",
                fontStyle: "bold",
            },
            {
                token: "comparison",
                foreground: "#701a75",
                fontStyle: "bold",
            },
            {
                token: "ip",
                foreground: "#d97706",
            },
            {
                token: "number",
                foreground: "#ca8a04",
            },
            {
                token: "comment",
                foreground: "#7f7f7f",
            },
        ],
        colors: {
            "editor.foreground": "#000000",
            "editor.background": "#f2f2f2",
        },
    });

    const text = ["http", "host", "request", "user_agent"];
    const keywords = ["not", "and", "xor", "or", "eq", "ne", "lt", "le", "gt", "ge", "contains", "matches", "in"];

    monaco.languages.registerCompletionItemProvider("cf-rule", {
        provideCompletionItems: () => {
            const suggestions = [
                ...text.map((text) => ({
                    label: text,
                    kind: monaco.languages.CompletionItemKind.Text,
                    insertText: text,
                })),
                ...keywords.map((keyword) => ({
                    label: keyword,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: keyword,
                })),
                {
                    label: "bot",
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: "(http.user_agent contains \"${1:bot}\") $0",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: "Rule to match a bot",
                },
            ];
            return {
                suggestions: suggestions,
            };
        },
    });

    const editorContainer = document.getElementById("container");

    cfeditor = monaco.editor.create(editorContainer, {
        theme: "cf-rule",
        language: "cf-rule",
        scrollBeyondLastLine: false,
    });

    cfeditor.currentState = "unloaded";

    cfeditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
        const name = cfeditor.currentFile;
        saveRule(name);
    });

    cfeditor.onDidChangeModelContent(function (e) {
        if (cfeditor.currentState === "unloaded") {
            setEditorState("loaded");
        } else if (cfeditor.currentState === "loaded") {
            setEditorState("edited");
        }
    });

    window.addEventListener("resize", () => {
        // make editor as small as possible
        cfeditor.layout({ width: 0, height: 0 });

        // wait for next frame to ensure last layout finished
        window.requestAnimationFrame(() => {
            // get the parent dimensions and re-layout the editor
            const rect = editorContainer.parentElement.getBoundingClientRect();
            cfeditor.layout({ width: rect.width, height: 384 });
        });
    });
});
