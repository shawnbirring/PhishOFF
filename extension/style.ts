import type { CSSProperties } from "react"; // Importing CSSProperties as a type-only import

export const modalStyles: { overlay: CSSProperties; container: CSSProperties } = {
    overlay: {
        position: "fixed", // No need to cast anymore, "fixed" is acceptable
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
    },
    container: {
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "8px",
        minWidth: "500px",
        textAlign: "center",
        maxHeight: "80vh",
        overflowY: "auto",
    }
};

export const contentStyles: { text: CSSProperties; additionalContent: CSSProperties } = {
    text: {
        fontSize: "16px",
        color: "rgb(51, 51, 51)",
    },
    additionalContent: {
        marginTop: "20px",
    }
};

export const buttonStyles: { accept: CSSProperties; decline: CSSProperties } = {
    accept: {
        backgroundColor: "#4CAF50",
        color: "white",
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        marginRight: "10px",
    },
    decline: {
        backgroundColor: "#f44336",
        color: "white",
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    }
};
