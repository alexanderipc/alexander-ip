import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Alexander IP — Patent Services for Inventors & Startups";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          padding: "60px",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            width: 80,
            height: 4,
            background: "#14b8a6",
            borderRadius: 2,
            marginBottom: 32,
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Alexander IP
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            textAlign: "center",
            lineHeight: 1.4,
            marginBottom: 40,
            maxWidth: 800,
          }}
        >
          Patent Services for Inventors &amp; Startups
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: "#14b8a6" }}>
              50+
            </div>
            <div style={{ fontSize: 16, color: "#94a3b8", marginTop: 4 }}>
              Patents Granted
            </div>
          </div>
          <div
            style={{
              width: 1,
              height: 48,
              background: "#334155",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: "#14b8a6" }}>
              800+
            </div>
            <div style={{ fontSize: 16, color: "#94a3b8", marginTop: 4 }}>
              Five-Star Reviews
            </div>
          </div>
          <div
            style={{
              width: 1,
              height: 48,
              background: "#334155",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700, color: "#14b8a6" }}>
              155+
            </div>
            <div style={{ fontSize: 16, color: "#94a3b8", marginTop: 4 }}>
              Countries Covered
            </div>
          </div>
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "#64748b",
          }}
        >
          www.alexander-ip.com
        </div>
      </div>
    ),
    { ...size }
  );
}
