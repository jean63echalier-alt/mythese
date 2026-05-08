import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Mythèse — Le coach IA qui structure ton mémoire de recherche";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#faf8f5",
          fontFamily: "Georgia, serif",
          padding: "80px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 56, color: "#7b1f1f", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Mythèse
          </div>
          <div style={{ fontSize: 14, color: "#7b1f1f", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 8 }}>
            Coach méthodologique IA · Pas un rédacteur fantôme
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <div style={{ fontSize: 76, color: "#1a1a1a", fontWeight: 600, lineHeight: 1.05 }}>
            Le coach IA qui structure ton
          </div>
          <div style={{ fontSize: 76, color: "#7b1f1f", fontWeight: 600, fontStyle: "italic", lineHeight: 1.05 }}>
            mémoire de recherche.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 22, color: "#4a4a4a", maxWidth: 700, lineHeight: 1.3 }}>
            <span>Sources peer-reviewed via OpenAlex.</span>
            <span>Méthodologie française. Jamais à ta place.</span>
          </div>
          <div style={{ fontSize: 18, color: "#767676" }}>mythese.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
