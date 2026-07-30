import { ImageResponse } from "next/og";

export const alt = "Margot Food & Drinks — Restobar en San José, Manglaralto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#232930",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Decorative border */}
        <div
          style={{
            position: "absolute",
            inset: "20px",
            border: "2px solid #FFC22033",
            borderRadius: "16px",
          }}
        />

        {/* Logo placeholder + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              background: "#FFC220",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: "bold",
              color: "#232930",
            }}
          >
            M
          </div>
          <span
            style={{ fontSize: "56px", fontWeight: "bold", color: "#FFC220" }}
          >
            Margot
          </span>
        </div>

        <p
          style={{
            fontSize: "32px",
            color: "#D7E0D9",
            marginBottom: "24px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Food &amp; Drinks
        </p>

        <div
          style={{
            width: "80px",
            height: "2px",
            background: "#FFC220",
            marginBottom: "24px",
          }}
        />

        <p
          style={{
            fontSize: "22px",
            color: "#b8c4bb",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Restobar frente al mar · San José, Manglaralto · Ecuador
        </p>
      </div>
    ),
    { ...size }
  );
}
