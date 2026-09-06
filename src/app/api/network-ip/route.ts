export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import os from "os";

function getLocalLanIp(): string {
  const interfaces = os.networkInterfaces();
  let wifiIp = "";
  let fallbackIp = "";

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        // Ignorar adaptadores virtuales como VirtualBox (192.168.56.x) o WSL/vEthernet
        if (addr.address.startsWith("192.168.56.")) continue;
        if (
          name.toLowerCase().includes("virtualbox") ||
          name.toLowerCase().includes("vbox") ||
          name.toLowerCase().includes("vethernet")
        ) {
          continue;
        }

        if (
          name.toLowerCase().includes("wi-fi") ||
          name.toLowerCase().includes("wireless") ||
          name.toLowerCase().includes("wlan") ||
          name.toLowerCase().includes("ethernet")
        ) {
          wifiIp = addr.address;
        } else if (!fallbackIp) {
          fallbackIp = addr.address;
        }
      }
    }
  }

  return wifiIp || fallbackIp || "localhost";
}

export async function GET(request: Request) {
  const lanIp = getLocalLanIp();
  const hostHeader = request.headers.get("host") || "";
  const port = hostHeader.split(":")[1] || "3000";

  return NextResponse.json({
    lanIp,
    port,
    playUrl: `http://${lanIp}:${port}/play`,
  });
}
