export default {
    manifest: {
        manifest_version: 3,
        name: "DEV | Phish off",
        version: "0.0.1",
        description: "Protect against hackers!",
        icons: {
            "16": "icon16.plasmo.9f44d99c.png",
            "32": "icon32.plasmo.83dbbbab.png",
            "48": "icon48.plasmo.a78c509e.png",
            "64": "icon64.plasmo.15206795.png",
            "128": "icon128.plasmo.c11f39af.png"
        },
        action: {
            default_popup: "popup.html"
        },
        background: {
            service_worker: "background.ts",
        },
        host_permissions: ["https://*/*"],
        content_security_policy: {
            extension_pages: "script-src 'self' http://localhost; object-src 'self';"
        },
        web_accessible_resources: [
            {
                matches: ["<all_urls>"],
                resources: ["__plasmo_hmr_proxy__"]
            }
        ],
        

    }
}
