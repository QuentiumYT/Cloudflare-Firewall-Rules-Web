const helpKey = document.getElementById("help_key");
const helpToken = document.getElementById("help_token");

helpKey?.addEventListener("click", () => {
    Swal.fire({
        title: "How to get a Cloudflare Global API Key",
        width: 800,
        html:
            "<img src='static/img/cloudflare_key.png' alt='Cloudflare key generation' width='100%'>" +
            "<br><br>" +
            "<p>You can get your global key by clicking the \"View\" button in the API Keys section.</p>" +
            "<br>" +
            "<a href='https://dash.cloudflare.com/profile/api-tokens' class='text-secondary'>Click here</a>&nbsp;to get your key.</a>",
        confirmButtonText: "Alright, I got it!",
    });
});

helpToken?.addEventListener("click", () => {
    Swal.fire({
        title: "How to generate a Cloudflare API token",
        width: 800,
        html:
            "<img src='static/img/cloudflare_tokens.png' alt='Cloudflare token generation' width='100%'>" +
            "<br><br>" +
            "<p>You can get a token by clicking the \"Create Token\" button in the API Tokens section.</p>" +
            "<br>" +
            "<a href='https://dash.cloudflare.com/profile/api-tokens' class='text-secondary'>Click here</a>&nbsp;to generate your token.</a>",
        confirmButtonText: "Next step",
    })
        .then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: "How to generate a Cloudflare token",
                    width: 800,
                    html:
                        "<img src='static/img/cloudflare_token.png' alt='Cloudflare token generation' width='100%'>" +
                        "<br><br>" +
                        "<p>You can now enter specific access for this token to allow certain permissions only.</p>" +
                        "⚠️ Note that you'll need \"Zone\" and \"Firewall Services\" access to use this app.",
                    confirmButtonText: "Alright, I got it!",
                });
            }
        });
});
