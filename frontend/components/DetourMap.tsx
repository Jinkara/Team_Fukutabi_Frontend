// DetourMap.tsx
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

// 必要なときだけ動的に読み込む
export default function DetourMap({ spots }: { spots: any[] }) {
  const [RL, setRL] = useState<null | typeof import("react-leaflet")>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    // クライアントでのみ実行
    (async () => {
      const rl = await import("react-leaflet");
      const leaflet = await import("leaflet");

      // 既定アイコン（/public 配下）— 未分類やフォールバック用
      leaflet.Icon.Default.mergeOptions({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      setRL(rl);
      setL(leaflet);
    })();
  }, []);

  // 読み込み中プレースホルダ
  if (!RL || !L) return <div style={{ height: 300 }}>Loading map…</div>;

  const { MapContainer, TileLayer, Marker, Popup } = RL as unknown as {
  MapContainer: React.ComponentType<any>;
  TileLayer: React.ComponentType<any>;
  Marker: React.ComponentType<any>;
  Popup: React.ComponentType<any>;
};

  // ✅ L が読み込まれた後にだけカラーアイコンを作る（SSR安全 & 最小変更）
  const iconByCategory = useMemo(() => {
    if (!L) return null;

    const createColoredIcon = (color: "red" | "green" | "blue") =>
      new L.Icon({
        // 1x / 2x 両方設定（外部CDN）。必要なら自前の /public に置き換え可
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
        iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

    return {
      local: createColoredIcon("red"),
      gourmet: createColoredIcon("green"),
      event: createColoredIcon("blue"),
    } as Record<string, InstanceType<typeof L.Icon>>;
  }, [L]);

  return (
    <div style={{ height: 360, width: "100%" }}>
      <MapContainer
        center={[35.681236, 139.767125]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {spots?.map((s: any) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            // ✅ カテゴリに応じて色分け。該当なし/未読込ならデフォルトにフォールバック
            icon={iconByCategory?.[s.category] ?? undefined}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {s.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
